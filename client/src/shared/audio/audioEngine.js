import { createAudioCuePolicy } from "./audioCuePolicy";
import { createAudioLoader } from "./audioLoader";
import { createAudioMusicPlayer } from "./audioMusicPlayer";
import { sanitizeGain, sanitizePlaybackRate } from "./audioPlaybackOptions";
import { createAudioRegistry } from "./audioRegistry";
import { AUDIO_SETTINGS_DEFAULTS, sanitizeAudioSettings } from "./audioSettings";
import {
  AUDIO_ENGINE_STATUS as STATUS,
  AUDIO_KINDS as KINDS,
  AUDIO_LOOP_CHANNELS,
  AUDIO_PLAY_RESULTS as RESULT,
} from "./audioTypes";

const RAMP_SECONDS = 0.05;
const LOOP_FADE_SECONDS = 0.25;
const UNLOCK_DEDUPE_MS = 1000;
const LOOP_CHANNELS = Object.values(AUDIO_LOOP_CHANNELS);

function createBrowserAudioContext() {
  const AudioContextClass = window.AudioContext ?? window.webkitAudioContext;
  return AudioContextClass ? new AudioContextClass() : null;
}

function openContext(createContext) {
  try {
    return createContext();
  } catch {
    return null;
  }
}

const closeQuietly = (target) => Promise.resolve(target.close?.()).catch(() => undefined);

export function createAudioEngine({
  createContext = createBrowserAudioContext,
  createMediaElement = () => document.createElement("audio"),
  loader = createAudioLoader(),
  now = () => performance.now(),
} = {}) {
  const registry = createAudioRegistry();
  const policy = createAudioCuePolicy();
  const desiredLoops = new Map();
  const activeLoops = new Map();
  const liveVoices = new Set();
  const preloadUrls = new Set();
  let settings = { ...AUDIO_SETTINGS_DEFAULTS };
  let context = null;
  let buses = null;
  let music = null;
  let desiredMusic = null;
  let musicOwner = 0;
  let hidden = false;
  let unavailable = false;
  let pendingUnlock = null;

  const isRunning = () => context?.state === "running";

  const assetOf = (key, kind) => {
    const descriptor = registry.get(key);
    return descriptor?.kind === kind ? descriptor : null;
  };

  const busLevel = (bus) => {
    if (bus === "music") return settings.musicEnabled ? settings.musicVolume : 0;
    return settings.sfxEnabled ? settings.sfxVolume : 0;
  };

  function status() {
    if (unavailable) return STATUS.UNAVAILABLE;
    if (context == null) return STATUS.LOCKED;
    if (context.state === "running") return STATUS.RUNNING;
    return context.state === "interrupted" ? STATUS.INTERRUPTED : STATUS.SUSPENDED;
  }

  function load(url, onReady) {
    if (context == null) {
      loader.prefetch(url);
      return;
    }
    loader.loadBuffer(context, url).then(onReady).catch(() => undefined);
  }

  function startVoice(source, gain, onEnded) {
    const voice = { source, gain, done: false };
    voice.cleanup = () => {
      if (voice.done) return;
      voice.done = true;
      source.disconnect();
      gain.disconnect();
      liveVoices.delete(voice);
      onEnded(voice);
    };
    source.onended = voice.cleanup;
    liveVoices.add(voice);
    try {
      source.connect(gain).connect(buses.sfx);
      source.start();
      return voice;
    } catch {
      voice.cleanup();
      return null;
    }
  }

  function syncLoop(channel) {
    const desired = desiredLoops.get(channel);
    const active = activeLoops.get(channel);
    if (active != null && active.key === desired?.key) return;
    if (active != null) {
      active.gain.gain.setTargetAtTime(0, context.currentTime, LOOP_FADE_SECONDS / 5);
      active.source.stop(context.currentTime + LOOP_FADE_SECONDS);
      activeLoops.delete(channel);
    }
    if (desired == null || !isRunning()) return;
    const descriptor = registry.get(desired.key);
    const buffer = loader.getBuffer(descriptor.url);
    if (buffer == null) {
      load(descriptor.url, () => syncLoop(channel));
      return;
    }
    let voice;
    try {
      const source = context.createBufferSource();
      const gain = context.createGain();
      source.buffer = buffer;
      source.loop = true;
      source.loopStart = descriptor.loopStart;
      source.loopEnd = descriptor.loopEnd;
      source.playbackRate.value = desired.rate;
      gain.gain.value = 0;
      gain.gain.setTargetAtTime(descriptor.gain * desired.gain, context.currentTime, RAMP_SECONDS);
      voice = startVoice(source, gain, (ended) => {
        if (activeLoops.get(channel) === ended) activeLoops.delete(channel);
      });
    } catch {
      return;
    }
    if (voice == null) return;
    voice.key = desired.key;
    activeLoops.set(channel, voice);
  }

  function applyLoopParams(channel) {
    const desired = desiredLoops.get(channel);
    const active = activeLoops.get(channel);
    if (active == null || active.key !== desired?.key) return;
    const at = context.currentTime;
    active.gain.gain.setTargetAtTime(registry.get(desired.key).gain * desired.gain, at, RAMP_SECONDS);
    active.source.playbackRate.setTargetAtTime(desired.rate, at, RAMP_SECONDS);
  }

  function syncMusic() {
    if (music == null) return;
    music.sync({
      descriptor: desiredMusic && registry.get(desiredMusic.key),
      level: desiredMusic?.gain ?? 1,
      audible: !hidden && settings.musicEnabled && isRunning(),
    });
  }

  function syncPlayback() {
    new Set([...desiredLoops.keys(), ...activeLoops.keys()]).forEach(syncLoop);
    syncMusic();
  }

  function wireContext(candidate) {
    const nextBuses = { music: candidate.createGain(), sfx: candidate.createGain() };
    Object.entries(nextBuses).forEach(([bus, node]) => {
      node.gain.value = busLevel(bus);
      node.connect(candidate.destination);
    });
    candidate.addEventListener?.("statechange", syncPlayback);
    return nextBuses;
  }

  function ensureContext() {
    if (context != null || unavailable) return context;
    const candidate = openContext(createContext);
    if (candidate == null) {
      unavailable = true;
      return null;
    }
    try {
      buses = wireContext(candidate);
    } catch {
      closeQuietly(candidate);
      return null;
    }
    context = candidate;
    music = createAudioMusicPlayer({ context, destination: buses.music, createMediaElement, rampSeconds: RAMP_SECONDS });
    preloadUrls.forEach((url) => load(url));
    return context;
  }

  function afterContextCall(call) {
    let pending;
    try {
      pending = call();
    } catch (error) {
      pending = Promise.reject(error);
    }
    // Safari rejects resume() while interrupted; playback stays desired and the next gesture unlocks again.
    return Promise.resolve(pending).then(syncPlayback, () => undefined).then(status);
  }

  function unlock() {
    const ctx = ensureContext();
    if (ctx == null) return Promise.resolve(status());
    if (ctx.state === "running") {
      syncPlayback();
      return Promise.resolve(status());
    }
    // One tap fires pointerup, touchend and click: they share one resume(), unless it hangs past the dedupe window.
    if (pendingUnlock != null && now() - pendingUnlock.startedAt < UNLOCK_DEDUPE_MS) return pendingUnlock.promise;
    const attempt = { startedAt: now() };
    // resume() has to run synchronously inside the user gesture that called unlock().
    attempt.promise = afterContextCall(() => ctx.resume()).finally(() => {
      if (pendingUnlock === attempt) pendingUnlock = null;
    });
    pendingUnlock = attempt;
    return attempt.promise;
  }

  function playSfx(key, { gain, rate } = {}) {
    const descriptor = assetOf(key, KINDS.SFX);
    if (descriptor == null) return RESULT.MISSING;
    if (!settings.sfxEnabled) return RESULT.MUTED;
    if (!isRunning()) return RESULT.LOCKED;
    const buffer = loader.getBuffer(descriptor.url);
    if (buffer == null) {
      load(descriptor.url);
      return RESULT.NOT_READY;
    }
    const blocked = policy.acquire(key, now(), descriptor);
    if (blocked) return blocked;
    try {
      const source = context.createBufferSource();
      const voiceGain = context.createGain();
      source.buffer = buffer;
      source.playbackRate.value = sanitizePlaybackRate(rate);
      voiceGain.gain.value = descriptor.gain * sanitizeGain(gain);
      return startVoice(source, voiceGain, () => policy.release(key)) == null ? RESULT.FAILED : RESULT.PLAYED;
    } catch {
      policy.release(key);
      return RESULT.FAILED;
    }
  }

  function startLoop(channel, key, { gain, rate } = {}) {
    if (!LOOP_CHANNELS.includes(channel) || assetOf(key, KINDS.LOOP) == null) return RESULT.MISSING;
    const previous = desiredLoops.get(channel);
    const same = previous?.key === key;
    desiredLoops.set(channel, {
      key,
      gain: sanitizeGain(gain, same ? previous.gain : 1),
      rate: sanitizePlaybackRate(rate, same ? previous.rate : 1),
    });
    if (same) applyLoopParams(channel);
    else syncLoop(channel);
    return isRunning() ? RESULT.PLAYED : RESULT.LOCKED;
  }

  // Only the current owner token releases, so a stale cleanup never stops the next screen's music.
  function claimMusic(key, { gain } = {}) {
    if (assetOf(key, KINDS.MUSIC) == null) return null;
    musicOwner += 1;
    desiredMusic = { key, gain: sanitizeGain(gain), owner: musicOwner };
    syncMusic();
    return musicOwner;
  }

  function releaseMusic(owner) {
    if (owner == null || desiredMusic?.owner !== owner) return;
    desiredMusic = null;
    syncMusic();
  }

  function dispose() {
    liveVoices.forEach((voice) => {
      voice.source.stop();
      voice.cleanup();
    });
    [activeLoops, desiredLoops, preloadUrls].forEach((collection) => collection.clear());
    music?.release();
    policy.clear();
    loader.clear();
    if (context != null) {
      context.removeEventListener?.("statechange", syncPlayback);
      closeQuietly(context);
    }
    context = null;
    buses = null;
    music = null;
    desiredMusic = null;
    hidden = false;
    unavailable = false;
    pendingUnlock = null;
  }

  return {
    register: (manifest) => registry.register(manifest),
    configure(next) {
      settings = sanitizeAudioSettings({ ...settings, ...next }, settings);
      if (buses != null) {
        Object.entries(buses).forEach(([bus, node]) => {
          node.gain.setTargetAtTime(busLevel(bus), context.currentTime, RAMP_SECONDS);
        });
      }
      syncMusic();
    },
    preload(keys) {
      const descriptors = keys == null
        ? registry.list().filter((descriptor) => descriptor.preload)
        : keys.map((key) => registry.get(key)).filter(Boolean);
      descriptors.filter((descriptor) => descriptor.kind !== KINDS.MUSIC).forEach((descriptor) => {
        preloadUrls.add(descriptor.url);
        load(descriptor.url);
      });
    },
    unlock,
    suspend() {
      hidden = true;
      syncMusic();
      return context == null ? Promise.resolve(status()) : afterContextCall(() => context.suspend());
    },
    resume() {
      hidden = false;
      return context == null ? Promise.resolve(status()) : afterContextCall(() => context.resume());
    },
    playSfx,
    startLoop,
    stopLoop(channel) {
      desiredLoops.delete(channel);
      syncLoop(channel);
    },
    claimMusic,
    releaseMusic,
    getState: () => ({
      status: status(),
      loops: Object.fromEntries([...desiredLoops].map(([channel, { key }]) => [channel, key])),
      music: desiredMusic?.key ?? null,
    }),
    dispose,
  };
}

export const audioEngine = createAudioEngine();
