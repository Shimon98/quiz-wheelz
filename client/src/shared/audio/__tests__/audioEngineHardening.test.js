import process from "node:process";
import { describe, expect, it, vi } from "vitest";

import { createAudioLoader } from "../audioLoader";
import { sanitizeGain, sanitizePlaybackRate } from "../audioPlaybackOptions";
import { AUDIO_ENGINE_STATUS as STATUS, AUDIO_PLAY_RESULTS as RESULT } from "../audioTypes";
import {
  FakeAudioContext,
  createFakeAudioFetch,
  flushAudioWork,
  setupAudioEngine,
  startedSources,
} from "../audioTestFakes";

async function setupUnlocked() {
  const setup = setupAudioEngine();
  setup.engine.preload();
  setup.engine.configure({ musicEnabled: true });
  await setup.engine.unlock();
  await flushAudioWork();
  return setup;
}

const loopSources = (context) => startedSources(context).filter((source) => source.loop);
const gainOf = (source) => source.connect.mock.calls[0][0];
const valuesOf = (param) => [param.value, ...param.setTargetAtTime.mock.calls.map(([value]) => value)];

function setupPendingResume() {
  const context = new FakeAudioContext();
  const createContext = vi.fn(() => context);
  let finishResume = () => {};
  context.resume = vi.fn(() => new Promise((resolve) => {
    finishResume = () => {
      context.setState("running");
      resolve();
    };
  }));
  return { ...setupAudioEngine({ createContext }), context, createContext, finish: () => finishResume() };
}

describe("unlock while a resume is still pending", () => {
  it("shares one context and one resume() between overlapping unlocks", async () => {
    const { engine, context, createContext, finish } = setupPendingResume();

    const callers = [engine.unlock(), engine.unlock(), engine.unlock()];
    expect(context.state).toBe("suspended");
    expect(createContext).toHaveBeenCalledTimes(1);
    expect(context.resume).toHaveBeenCalledTimes(1);
    finish();

    await expect(Promise.all(callers)).resolves.toEqual([STATUS.RUNNING, STATUS.RUNNING, STATUS.RUNNING]);
  });

  it("lets a later gesture call resume() again when an earlier one never settles", () => {
    const { engine, context, clock } = setupPendingResume();

    engine.unlock();
    clock.now = 500;
    engine.unlock();
    clock.now = 1500;
    engine.unlock();

    expect(context.resume).toHaveBeenCalledTimes(2);
  });
});

function setupBrokenFirstContext(breakContext) {
  const contexts = [];
  const createContext = () => {
    const context = new FakeAudioContext();
    if (contexts.length === 0) breakContext(context);
    contexts.push(context);
    return context;
  };
  return { ...setupAudioEngine({ createContext }), contexts };
}

function failGainCreation(context) {
  context.createGain = () => {
    throw new Error("gain allocation failed");
  };
}

function failBusConnection(context) {
  const createGain = context.createGain.bind(context);
  context.createGain = () => Object.assign(createGain(), {
    connect: () => {
      throw new Error("bus connect failed");
    },
  });
}

describe("context setup failure", () => {
  it.each([
    ["a bus cannot be created", failGainCreation],
    ["a bus cannot be connected", failBusConnection],
  ])("closes the half-built context when %s and builds a whole one on the next gesture", async (_, breakContext) => {
    const { engine, contexts, media } = setupBrokenFirstContext(breakContext);
    engine.configure({ musicEnabled: true });
    engine.preload();
    engine.claimMusic("race");

    await expect(engine.unlock()).resolves.toBe(STATUS.LOCKED);
    expect(contexts[0].close).toHaveBeenCalled();
    expect(contexts[0].listeners.size).toBe(0);
    await expect(engine.unlock()).resolves.toBe(STATUS.RUNNING);
    await flushAudioWork();

    expect(contexts).toHaveLength(2);
    expect(engine.playSfx("blip")).toBe(RESULT.PLAYED);
    expect(startedSources(contexts[1])).toHaveLength(1);
    expect(media).toHaveLength(1);
    expect(media[0].paused).toBe(false);
  });
});

describe("loop node cleanup", () => {
  it("disconnects every replaced loop once it ends, and a late end never removes the replacement", async () => {
    const { engine, contexts } = await setupUnlocked();
    ["hum", "wind", "hum", "wind"].forEach((key) => engine.startLoop("engine", key));
    const loops = loopSources(contexts[0]);
    const replaced = loops.slice(0, -1);
    const current = loops.at(-1);

    replaced.forEach((source) => source.onended());
    engine.startLoop("engine", "wind", { rate: 1.2 });

    expect(loops).toHaveLength(4);
    replaced.forEach((source) => {
      expect(source.disconnect).toHaveBeenCalled();
      expect(gainOf(source).disconnect).toHaveBeenCalled();
    });
    expect(current.disconnect).not.toHaveBeenCalled();
    expect(current.playbackRate.setTargetAtTime).toHaveBeenCalledWith(1.2, expect.any(Number), expect.any(Number));
    expect(engine.getState().loops).toEqual({ engine: "wind" });
  });

  it("disconnects a stopped loop when it ends", async () => {
    const { engine, contexts } = await setupUnlocked();
    engine.startLoop("ambience", "wind");
    const [loop] = loopSources(contexts[0]);

    engine.stopLoop("ambience");
    loop.onended();

    expect(loop.stop).toHaveBeenCalled();
    expect(loop.disconnect).toHaveBeenCalled();
    expect(gainOf(loop).disconnect).toHaveBeenCalled();
  });

  it("dispose disconnects every loop, including one that is still fading out", async () => {
    const { engine, contexts } = await setupUnlocked();
    engine.startLoop("engine", "hum");
    engine.startLoop("engine", "wind");
    engine.startLoop("ambience", "hum");

    engine.dispose();

    loopSources(contexts[0]).forEach((source) => {
      expect(source.stop).toHaveBeenCalled();
      expect(source.disconnect).toHaveBeenCalled();
      expect(gainOf(source).disconnect).toHaveBeenCalled();
    });
  });
});

async function collectUnhandledRejections(run) {
  const rejections = [];
  const record = (reason) => rejections.push(reason);
  process.on("unhandledRejection", record);
  try {
    await run();
    await flushAudioWork();
    await flushAudioWork();
  } finally {
    process.off("unhandledRejection", record);
  }
  return rejections;
}

async function expectLoopRecovers(engine, context) {
  engine.suspend();
  await engine.resume();
  expect(loopSources(context).filter((source) => !source.disconnect.mock.calls.length)).toHaveLength(1);
}

describe("loop failure isolation", () => {
  it("keeps the game running when a loop's audio node cannot be created", async () => {
    const { engine, contexts } = await setupUnlocked();
    const [context] = contexts;
    const createBufferSource = context.createBufferSource.bind(context);
    context.createBufferSource = () => {
      throw new Error("node failure");
    };

    expect(() => engine.startLoop("engine", "hum")).not.toThrow();
    expect(engine.getState().loops).toEqual({ engine: "hum" });
    context.createBufferSource = createBufferSource;
    await expectLoopRecovers(engine, context);
  });

  it("disconnects a loop whose start() fails and keeps it requested", async () => {
    const { engine, contexts } = await setupUnlocked();
    const [context] = contexts;
    const createBufferSource = context.createBufferSource.bind(context);
    context.createBufferSource = () => Object.assign(createBufferSource(), {
      start: vi.fn(() => {
        throw new Error("start failure");
      }),
    });

    expect(() => engine.startLoop("engine", "hum")).not.toThrow();
    const [failed] = context.sources;
    expect(failed.disconnect).toHaveBeenCalled();
    expect(gainOf(failed).disconnect).toHaveBeenCalled();
    expect(engine.getState().loops).toEqual({ engine: "hum" });
    context.createBufferSource = createBufferSource;
    await expectLoopRecovers(engine, context);
  });

  it("contains a node failure that happens after the loop file finishes loading", async () => {
    const { engine, contexts } = setupAudioEngine();
    await engine.unlock();
    contexts[0].createBufferSource = () => {
      throw new Error("node failure");
    };

    const rejections = await collectUnhandledRejections(() => engine.startLoop("engine", "hum"));

    expect(rejections).toEqual([]);
    expect(engine.getState().loops).toEqual({ engine: "hum" });
  });

  it("contains an exception thrown by the ready callback itself", async () => {
    const realLoader = createAudioLoader({ fetchImpl: createFakeAudioFetch() });
    let reads = 0;
    const loader = {
      ...realLoader,
      getBuffer: (url) => {
        reads += 1;
        if (reads > 1) throw new Error("cache failure");
        return realLoader.getBuffer(url);
      },
    };
    const { engine } = setupAudioEngine({ loader });
    await engine.unlock();

    const rejections = await collectUnhandledRejections(() => engine.startLoop("engine", "hum"));

    expect(reads).toBe(2);
    expect(rejections).toEqual([]);
    expect(engine.getState().loops).toEqual({ engine: "hum" });
  });
});

describe("runtime option sanitization", () => {
  it("clamps gain to 0..1 and playback rate to 0.25..4, falling back for unusable input", () => {
    expect([1.7, -0.5, 0.4].map((gain) => sanitizeGain(gain))).toEqual([1, 0, 0.4]);
    expect([Number.NaN, Infinity, undefined].map((gain) => sanitizeGain(gain, 0.3))).toEqual([0.3, 0.3, 0.3]);
    expect([10, 0.1, 1.5].map((rate) => sanitizePlaybackRate(rate))).toEqual([4, 0.25, 1.5]);
    expect([0, -2, Number.NaN, -Infinity].map((rate) => sanitizePlaybackRate(rate, 1.3))).toEqual([1.3, 1.3, 1.3, 1.3]);
  });

  it.each([Number.NaN, Infinity, -Infinity, -1, 0, -2])("keeps %s out of every AudioParam", async (bad) => {
    const { engine, contexts } = await setupUnlocked();

    expect(() => {
      engine.playSfx("blip", { gain: bad, rate: bad });
      engine.startLoop("engine", "hum", { gain: bad, rate: bad });
      engine.startLoop("engine", "hum", { gain: bad, rate: bad });
      engine.claimMusic("race", { gain: bad });
    }).not.toThrow();

    const [context] = contexts;
    const gains = context.gains.flatMap((node) => valuesOf(node.gain));
    const rates = context.sources.flatMap((source) => valuesOf(source.playbackRate));
    expect(gains.every((value) => Number.isFinite(value) && value >= 0 && value <= 1)).toBe(true);
    expect(rates.every((value) => Number.isFinite(value) && value >= 0.25 && value <= 4)).toBe(true);
  });
});

describe("music playback transitions", () => {
  it("loops music by default and plays a one-shot track once", async () => {
    const { engine, media } = await setupUnlocked();

    engine.claimMusic("race");
    engine.claimMusic("jingle");

    expect(media.map(({ loop }) => loop)).toEqual([true, false]);
  });

  it("calls play() only when the music actually starts or resumes", async () => {
    const { engine, media } = await setupUnlocked();

    engine.claimMusic("race");
    engine.configure({ musicVolume: 0.3 });
    engine.configure({ sfxVolume: 0.2 });
    engine.claimMusic("race");
    expect(media[0].play).toHaveBeenCalledTimes(1);

    engine.configure({ musicEnabled: false });
    engine.configure({ musicEnabled: false });
    engine.configure({ musicEnabled: true });
    expect(media[0].play).toHaveBeenCalledTimes(2);
    expect(media[0].pause).toHaveBeenCalledTimes(1);
  });

  it("does not replay a finished one-shot track when the volume changes", async () => {
    const { engine, media } = await setupUnlocked();
    engine.claimMusic("jingle");
    media[0].ended = true;
    media[0].paused = true;

    engine.configure({ musicVolume: 0.4 });

    expect(media[0].play).toHaveBeenCalledTimes(1);
  });
});
