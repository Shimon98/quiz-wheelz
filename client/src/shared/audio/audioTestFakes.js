import { vi } from "vitest";

import { createAudioEngine } from "./audioEngine";
import { createAudioLoader } from "./audioLoader";

const RATE = 48000;

function createParam(value) {
  const param = { value, setTargetAtTime: vi.fn((target) => { param.value = target; }) };
  return param;
}

function createNode(extra = {}) {
  return { connect: vi.fn((target) => target), disconnect: vi.fn(), ...extra };
}

function createFakeBuffer(seconds, channels = 1) {
  const length = Math.round(seconds * RATE);
  const data = Float32Array.from({ length }, (_, i) => 0.8 * Math.cos((2 * Math.PI * 110 * i) / RATE));
  return { length, duration: seconds, sampleRate: RATE, numberOfChannels: channels, getChannelData: () => data };
}

export class FakeAudioContext {
  constructor() {
    this.state = "suspended";
    this.sampleRate = RATE;
    this.currentTime = 0;
    this.destination = createNode();
    this.sources = [];
    this.gains = [];
    this.resumeError = null;
    this.listeners = new Set();
    this.close = vi.fn(() => {
      this.state = "closed";
      return Promise.resolve();
    });
  }

  setState(state) {
    this.state = state;
    this.listeners.forEach((listener) => listener());
  }

  addEventListener(type, listener) {
    if (type === "statechange") this.listeners.add(listener);
  }

  removeEventListener(type, listener) {
    this.listeners.delete(listener);
  }

  resume() {
    if (this.resumeError) return Promise.reject(this.resumeError);
    this.setState("running");
    return Promise.resolve();
  }

  suspend() {
    this.setState("suspended");
    return Promise.resolve();
  }

  createGain() {
    const gain = createNode({ gain: createParam(1) });
    this.gains.push(gain);
    return gain;
  }

  createBufferSource() {
    const source = createNode({
      buffer: null,
      loop: false,
      loopStart: 0,
      loopEnd: 0,
      playbackRate: createParam(1),
      start: vi.fn(),
      stop: vi.fn(),
    });
    this.sources.push(source);
    return source;
  }

  createMediaElementSource(element) {
    return createNode({ element });
  }

  decodeAudioData(bytes) {
    if (bytes.byteLength === 0) return Promise.reject(new TypeError("Cannot decode detached ArrayBuffer"));
    const buffer = createFakeBuffer(bytes.seconds, bytes.channels);
    bytes.byteLength = 0;
    return Promise.resolve(buffer);
  }
}

export function createFakeMediaElement({ holdPlay = false } = {}) {
  let pendingPlay = null;
  const element = {
    paused: true,
    ended: false,
    currentTime: 0,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    removeAttribute: vi.fn(),
    load: vi.fn(),
    play: vi.fn(() => {
      element.paused = false;
      if (!holdPlay) return Promise.resolve();
      return new Promise((resolve, reject) => {
        pendingPlay = { resolve, reject };
      });
    }),
    pause: vi.fn(() => {
      element.paused = true;
      pendingPlay?.reject(new DOMException("play() was interrupted by pause()", "AbortError"));
      pendingPlay = null;
    }),
  };
  return element;
}

export function createFakeAudioFetch({ contentType = "audio/wav" } = {}) {
  return vi.fn((url) => Promise.resolve({
    ok: true,
    status: 200,
    headers: { get: () => contentType },
    arrayBuffer: () => fakeBytesFor(url),
  }));
}

function fakeBytesFor(url) {
  const seconds = url.includes("music") ? 4 : url.includes("engine") ? 2 : 0.3;
  return Promise.resolve({ byteLength: 1000, seconds, channels: url.includes("music") ? 2 : 1 });
}

export const TEST_AUDIO_MANIFEST = Object.freeze([
  { key: "blip", kind: "sfx", url: "/blip.wav", gain: 0.5, cooldownMs: 100, maxVoices: 2 },
  { key: "hum", kind: "loop", url: "/engine-hum.wav", loopStart: 0.01, loopEnd: 2.01 },
  { key: "wind", kind: "loop", url: "/wind.wav" },
  { key: "race", kind: "music", url: "/race-music.m4a" },
  { key: "results", kind: "music", url: "/results-music.m4a" },
  { key: "jingle", kind: "music", url: "/jingle-music.m4a", loop: false },
]);

export function setupAudioEngine({ holdPlay = false, createContext, loader } = {}) {
  const contexts = [];
  const media = [];
  const clock = { now: 0 };
  const fetchImpl = createFakeAudioFetch();
  const engine = createAudioEngine({
    createContext: createContext ?? (() => {
      const context = new FakeAudioContext();
      contexts.push(context);
      return context;
    }),
    createMediaElement: () => {
      const element = createFakeMediaElement({ holdPlay });
      media.push(element);
      return element;
    },
    loader: loader ?? createAudioLoader({ fetchImpl }),
    now: () => clock.now,
  });
  engine.register(TEST_AUDIO_MANIFEST);
  return { engine, contexts, media, fetchImpl, clock };
}

export const startedSources = (context) => context.sources.filter((source) => source.start.mock.calls.length > 0);

export const flushAudioWork = () => new Promise((resolve) => setTimeout(resolve, 0));
