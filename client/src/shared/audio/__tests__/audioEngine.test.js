import { describe, expect, it, vi } from "vitest";

import * as audioApi from "../index";
import { AUDIO_ENGINE_STATUS as STATUS, AUDIO_PLAY_RESULTS as RESULT } from "../audioTypes";
import { flushAudioWork, setupAudioEngine, startedSources } from "../audioTestFakes";

async function setupUnlocked(options) {
  const setup = setupAudioEngine(options);
  setup.engine.preload();
  await setup.engine.unlock();
  await flushAudioWork();
  return setup;
}

const loopSources = (context) => startedSources(context).filter((source) => source.loop);
const busGain = (context, bus) => context.gains[bus === "music" ? 0 : 1].gain;

describe("audio engine unlock", () => {
  it("creates no AudioContext before the first unlock", () => {
    const { engine, contexts } = setupAudioEngine();

    engine.configure({ musicEnabled: true });
    engine.preload();
    engine.playSfx("blip");
    engine.startLoop("engine", "hum");
    engine.claimMusic("race");

    expect(contexts).toHaveLength(0);
    expect(engine.getState().status).toBe(STATUS.LOCKED);
  });

  it("creates one context for simultaneous unlocks and does not resume a running one", async () => {
    const { engine, contexts } = setupAudioEngine();

    await Promise.all([engine.unlock(), engine.unlock()]);
    const resume = vi.spyOn(contexts[0], "resume");
    await engine.unlock();

    expect(contexts).toHaveLength(1);
    expect(resume).not.toHaveBeenCalled();
    expect(engine.getState().status).toBe(STATUS.RUNNING);
  });

  it("stays recoverable when Safari rejects resume() after an interruption", async () => {
    const { engine, contexts } = await setupUnlocked();
    engine.startLoop("engine", "hum");
    const [context] = contexts;

    context.setState("interrupted");
    engine.suspend();
    context.resumeError = new DOMException("interrupted", "InvalidStateError");
    await expect(engine.resume()).resolves.toBe(STATUS.SUSPENDED);
    context.resumeError = null;
    await engine.unlock();
    await flushAudioWork();

    expect(engine.getState()).toMatchObject({ status: STATUS.RUNNING, loops: { engine: "hum" } });
    expect(loopSources(context)).toHaveLength(1);
  });

  it("reports unavailable instead of throwing when the browser has no Web Audio", async () => {
    const { engine } = setupAudioEngine({ createContext: () => null });

    await expect(engine.unlock()).resolves.toBe(STATUS.UNAVAILABLE);
    expect(engine.playSfx("blip")).toBe(RESULT.LOCKED);
  });
});

describe("audio engine sound effects", () => {
  it("drops a one-shot requested before unlock instead of queueing it", async () => {
    const { engine, contexts } = setupAudioEngine();

    expect(engine.playSfx("blip")).toBe(RESULT.LOCKED);
    await engine.unlock();
    await flushAudioWork();

    expect(startedSources(contexts[0])).toHaveLength(0);
  });

  it("drops a one-shot while the context is suspended or interrupted", async () => {
    const { engine, contexts } = await setupUnlocked();

    contexts[0].setState("interrupted");

    expect(engine.playSfx("blip")).toBe(RESULT.LOCKED);
    expect(startedSources(contexts[0])).toHaveLength(0);
  });

  it("starts loading an asset that was not preloaded and plays it once ready", async () => {
    const { engine } = setupAudioEngine();
    await engine.unlock();

    expect(engine.playSfx("blip")).toBe(RESULT.NOT_READY);
    await flushAudioWork();
    expect(engine.playSfx("blip")).toBe(RESULT.PLAYED);
  });

  it("is muted while sound effects are off", async () => {
    const { engine } = await setupUnlocked();

    engine.configure({ sfxEnabled: false });

    expect(engine.playSfx("blip")).toBe(RESULT.MUTED);
  });

  it("multiplies the asset gain by the call gain", async () => {
    const { engine, contexts } = await setupUnlocked();

    engine.playSfx("blip", { gain: 0.6 });

    expect(contexts[0].gains.at(-1).gain.value).toBeCloseTo(0.3, 6);
  });

  it("enforces the cooldown and the voice limit of each cue", async () => {
    const { engine, contexts, clock } = await setupUnlocked();
    const at = (ms) => {
      clock.now = ms;
      return engine.playSfx("blip");
    };

    expect([at(0), at(50), at(100), at(200)]).toEqual([RESULT.PLAYED, RESULT.COOLDOWN, RESULT.PLAYED, RESULT.VOICE_LIMIT]);
    startedSources(contexts[0])[0].onended();
    expect(at(300)).toBe(RESULT.PLAYED);
  });

  it("never throws for an unknown key or a failing audio node", async () => {
    const { engine, contexts } = await setupUnlocked();
    contexts[0].createBufferSource = () => {
      throw new Error("node failure");
    };

    expect(engine.playSfx("nope")).toBe(RESULT.MISSING);
    expect(engine.playSfx("blip")).toBe(RESULT.FAILED);
  });
});

describe("audio engine loops", () => {
  it("remembers a loop requested while locked and starts it once after unlock", async () => {
    const { engine, contexts } = setupAudioEngine();

    expect(engine.startLoop("engine", "hum")).toBe(RESULT.LOCKED);
    await engine.unlock();
    await flushAudioWork();
    engine.startLoop("engine", "hum");
    await flushAudioWork();

    const [loop] = loopSources(contexts[0]);
    expect(loopSources(contexts[0])).toHaveLength(1);
    expect(loop).toMatchObject({ loopStart: 0.01, loopEnd: 2.01 });
  });

  it("updates the running loop instead of restarting it", async () => {
    const { engine, contexts } = await setupUnlocked();
    engine.startLoop("engine", "hum");

    engine.startLoop("engine", "hum", { rate: 1.3, gain: 0.4 });
    engine.startLoop("engine", "hum", { rate: 1.1 });

    const [loop] = loopSources(contexts[0]);
    expect(loopSources(contexts[0])).toHaveLength(1);
    expect(loop.playbackRate.setTargetAtTime.mock.calls.map(([rate]) => rate)).toEqual([1.3, 1.1]);
  });

  it("fades the old loop out when another key takes the channel", async () => {
    const { engine, contexts } = await setupUnlocked();
    engine.startLoop("engine", "hum");

    engine.startLoop("engine", "wind");

    const [hum, wind] = loopSources(contexts[0]);
    expect(hum.stop).toHaveBeenCalled();
    expect(wind.stop).not.toHaveBeenCalled();
    expect(engine.getState().loops).toEqual({ engine: "wind" });
  });

  it("forgets a stopped loop, also across a suspend and resume", async () => {
    const { engine, contexts } = await setupUnlocked();
    engine.startLoop("engine", "hum");

    engine.stopLoop("engine");
    engine.suspend();
    await engine.resume();
    await flushAudioWork();

    expect(loopSources(contexts[0])).toHaveLength(1);
    expect(loopSources(contexts[0])[0].stop).toHaveBeenCalled();
    expect(engine.getState().loops).toEqual({});
  });

  it("keeps a loop through suspend and resume without starting a second source", async () => {
    const { engine, contexts } = await setupUnlocked();
    engine.startLoop("ambience", "wind");

    engine.suspend();
    await engine.resume();
    await flushAudioWork();

    expect(loopSources(contexts[0])).toHaveLength(1);
    expect(loopSources(contexts[0])[0].stop).not.toHaveBeenCalled();
  });

  it("holds a loop whose file finishes loading while the page is hidden until it is visible again", async () => {
    const { engine, contexts } = setupAudioEngine();
    await engine.unlock();
    engine.startLoop("engine", "hum");

    engine.suspend();
    await flushAudioWork();
    expect(loopSources(contexts[0])).toHaveLength(0);
    await engine.resume();

    expect(loopSources(contexts[0])).toHaveLength(1);
  });

  it("rejects an unknown loop channel or a non-loop asset", async () => {
    const { engine } = await setupUnlocked();

    expect(engine.startLoop("turbo", "hum")).toBe(RESULT.MISSING);
    expect(engine.startLoop("engine", "blip")).toBe(RESULT.MISSING);
  });
});

describe("audio engine settings and lifetime", () => {
  it("ramps the music and sound-effect buses without creating another context", async () => {
    const { engine, contexts } = await setupUnlocked();

    engine.configure({ musicEnabled: true, musicVolume: 0.3, sfxVolume: 0.9 });
    engine.configure({ sfxEnabled: false });

    expect(contexts).toHaveLength(1);
    expect(busGain(contexts[0], "music").value).toBe(0.3);
    expect(busGain(contexts[0], "sfx").setTargetAtTime.mock.calls.map(([value]) => value)).toEqual([0.9, 0]);
  });

  it("downloads preloaded assets before unlock and decodes them after it", async () => {
    const { engine, contexts, fetchImpl } = setupAudioEngine();

    engine.preload();
    expect(fetchImpl.mock.calls.map(([url]) => url)).toEqual(["/blip.wav", "/engine-hum.wav", "/wind.wav"]);
    await engine.unlock();
    await flushAudioWork();

    expect(engine.playSfx("blip")).toBe(RESULT.PLAYED);
    expect(fetchImpl).toHaveBeenCalledTimes(3);
    expect(contexts).toHaveLength(1);
  });

  it("dispose stops every source, releases the music and closes only its own context", async () => {
    const { engine, contexts, media } = await setupUnlocked();
    engine.configure({ musicEnabled: true });
    engine.playSfx("blip");
    engine.startLoop("engine", "hum");
    engine.claimMusic("race");

    engine.dispose();

    expect(startedSources(contexts[0]).every((source) => source.stop.mock.calls.length > 0)).toBe(true);
    expect(media[0].load).toHaveBeenCalled();
    expect(contexts[0].close).toHaveBeenCalled();
    expect(engine.getState()).toEqual({ status: STATUS.LOCKED, loops: {}, music: null });
  });
});

describe("audio public surface", () => {
  it("offers features one music ownership path and none of the internal outcome vocabulary", () => {
    expect(Object.keys(audioApi).sort()).toEqual(["AUDIO_KINDS", "AUDIO_LOOP_CHANNELS", "audioEngine", "useSceneMusic"]);
    expect(Object.keys(audioApi.audioEngine).sort()).toEqual([
      "claimMusic", "configure", "dispose", "getState", "playSfx", "preload", "register",
      "releaseMusic", "resume", "startLoop", "stopLoop", "suspend", "unlock",
    ]);
  });
});
