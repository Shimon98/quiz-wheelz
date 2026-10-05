import { afterEach, describe, expect, it, vi } from "vitest";

import { setupAudioEngine } from "../audioTestFakes";

async function setupMusic(options) {
  const setup = setupAudioEngine(options);
  setup.engine.configure({ musicEnabled: true });
  await setup.engine.unlock();
  return setup;
}

afterEach(() => {
  vi.useRealTimers();
});

describe("audio engine music", () => {
  it("neither creates nor downloads music while Music is off", async () => {
    const { engine, media, fetchImpl } = setupAudioEngine();
    await engine.unlock();

    engine.claimMusic("race");

    expect(media).toHaveLength(0);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("starts when Music is switched on and pauses when it is switched off", async () => {
    const { engine, media } = setupAudioEngine();
    await engine.unlock();
    engine.claimMusic("race");

    engine.configure({ musicEnabled: true });
    engine.configure({ musicEnabled: false });

    expect(media).toHaveLength(1);
    expect(media[0].play).toHaveBeenCalledTimes(1);
    expect(media[0].paused).toBe(true);
  });

  it("routes one media element through Web Audio and never re-creates its source", async () => {
    const { engine, contexts, media } = await setupMusic();
    const routeSource = vi.spyOn(contexts[0], "createMediaElementSource");

    engine.claimMusic("race");
    engine.configure({ musicEnabled: false });
    engine.configure({ musicEnabled: true });

    expect(media).toHaveLength(1);
    expect(media[0]).toMatchObject({ src: "/race-music.m4a", loop: true, paused: false });
    expect(routeSource).toHaveBeenCalledTimes(1);
  });

  it("pauses the media on hide, since it keeps playing while the context is suspended", async () => {
    const { engine, contexts, media } = await setupMusic();
    engine.claimMusic("race");
    contexts[0].suspend = () => Promise.resolve();

    engine.suspend();
    expect(media[0].paused).toBe(true);
    await engine.resume();

    expect(media[0].paused).toBe(false);
  });

  it("waits for the next gesture after Safari rejects the resume", async () => {
    const { engine, contexts, media } = await setupMusic();
    engine.claimMusic("race");
    engine.suspend();

    contexts[0].resumeError = new DOMException("interrupted", "InvalidStateError");
    await engine.resume();
    expect(media[0].paused).toBe(true);
    contexts[0].resumeError = null;
    await engine.unlock();

    expect(media[0].paused).toBe(false);
  });

  it("fades the old track out and releases it once the new key has taken over", async () => {
    vi.useFakeTimers();
    const { engine, media } = await setupMusic();
    engine.claimMusic("race");

    engine.claimMusic("results");
    expect(media[0].removeAttribute).not.toHaveBeenCalled();
    expect(media[1]).toMatchObject({ src: "/results-music.m4a", paused: false });
    vi.advanceTimersByTime(400);

    expect(media[0].removeAttribute).toHaveBeenCalledWith("src");
    expect(media[0].load).toHaveBeenCalled();
    expect(engine.getState().music).toBe("results");
  });

  it("stops safely while the media is still buffering", async () => {
    const { engine, media } = await setupMusic({ holdPlay: true });
    vi.useFakeTimers();

    engine.releaseMusic(engine.claimMusic("race"));
    await vi.advanceTimersByTimeAsync(400);

    expect(media[0].pause).toHaveBeenCalled();
    expect(engine.getState().music).toBeNull();
  });
});

describe("music ownership", () => {
  it("lets only the current owner release the music, so a stale cleanup cannot stop the next scene", async () => {
    const { engine, media } = await setupMusic();
    const lobby = engine.claimMusic("race");
    const race = engine.claimMusic("results");

    engine.releaseMusic(lobby);
    expect(engine.getState().music).toBe("results");
    engine.releaseMusic(race);

    expect(engine.getState().music).toBeNull();
    expect(media[1].paused).toBe(false);
  });

  it("keeps playing without a restart when a new owner claims the same key", async () => {
    const { engine, media } = await setupMusic();
    const first = engine.claimMusic("race");
    media[0].currentTime = 12;

    engine.claimMusic("race");
    engine.releaseMusic(first);

    expect(media).toHaveLength(1);
    expect(media[0].currentTime).toBe(12);
    expect(engine.getState().music).toBe("race");
  });

  it("revives a track that is still fading when its key comes straight back", async () => {
    vi.useFakeTimers();
    const { engine, media } = await setupMusic();
    const owner = engine.claimMusic("race");
    engine.releaseMusic(owner);

    engine.claimMusic("race");
    vi.advanceTimersByTime(1000);

    expect(media).toHaveLength(1);
    expect(media[0].removeAttribute).not.toHaveBeenCalled();
    expect(media[0].paused).toBe(false);
  });

  it("remembers the desired scene while Music is off and starts it when Music comes back", async () => {
    const { engine, media } = setupAudioEngine();
    await engine.unlock();
    engine.claimMusic("race");
    expect(media).toHaveLength(0);

    engine.configure({ musicEnabled: true });

    expect(media).toHaveLength(1);
    expect(media[0].paused).toBe(false);
    expect(engine.getState().music).toBe("race");
  });

  it("drops a fading track at once when Music is switched off or the page hides mid-transition", async () => {
    vi.useFakeTimers();
    const { engine, media } = await setupMusic();
    engine.claimMusic("race");
    engine.claimMusic("results");

    engine.configure({ musicEnabled: false });
    expect(media[0].removeAttribute).toHaveBeenCalledWith("src");
    expect(media[1].paused).toBe(true);
    engine.configure({ musicEnabled: true });
    engine.claimMusic("race");
    engine.suspend();

    expect(media[1].removeAttribute).toHaveBeenCalledWith("src");
    expect(engine.getState().music).toBe("race");
  });

  it.each([
    ["the page hides", (engine) => engine.suspend()],
    ["Music is switched off", (engine) => engine.configure({ musicEnabled: false })],
  ])("stops a track that is fading to silence at once when %s", async (_, silence) => {
    vi.useFakeTimers();
    const { engine, media } = await setupMusic();
    engine.releaseMusic(engine.claimMusic("race"));

    silence(engine);

    expect(media[0].paused).toBe(true);
    expect(media[0].removeAttribute).toHaveBeenCalledWith("src");
  });

  it("lets a released track fade out while the page stays visible", async () => {
    vi.useFakeTimers();
    const { engine, media } = await setupMusic();
    engine.releaseMusic(engine.claimMusic("race"));

    expect(media[0].paused).toBe(false);
    vi.advanceTimersByTime(400);

    expect(media[0].removeAttribute).toHaveBeenCalledWith("src");
  });

  it("ignores an unknown key and a missing owner", async () => {
    const { engine, media } = await setupMusic();

    expect(engine.claimMusic("nope")).toBeNull();
    engine.releaseMusic(null);

    expect(media).toHaveLength(0);
    expect(engine.getState().music).toBeNull();
  });
});

const healContext = (context) => ["createGain", "createMediaElementSource"].forEach((name) => delete context[name]);

describe("music resource failures", () => {
  it.each([
    ["the element cannot be routed into Web Audio", "createMediaElementSource"],
    ["the track gain cannot be created", "createGain"],
  ])("releases a half-opened track when %s and opens a fresh one on the next sync", async (_, failing) => {
    const { engine, contexts, media } = await setupMusic();
    contexts[0][failing] = () => {
      throw new Error(`${failing} failed`);
    };

    expect(() => engine.claimMusic("race")).not.toThrow();
    expect(media[0].removeAttribute).toHaveBeenCalledWith("src");
    healContext(contexts[0]);
    engine.configure({ musicVolume: 0.5 });

    expect(media).toHaveLength(2);
    expect(media[1]).toMatchObject({ src: "/race-music.m4a", paused: false });
    expect(engine.getState().music).toBe("race");
  });

  it("drops a track whose play() throws and opens a fresh one on the next sync", async () => {
    const { engine, media } = await setupMusic();
    engine.claimMusic("race");
    engine.configure({ musicEnabled: false });
    media[0].play = () => {
      throw new Error("play failed");
    };

    expect(() => engine.configure({ musicEnabled: true })).not.toThrow();
    expect(media[0].removeAttribute).toHaveBeenCalledWith("src");
    engine.configure({ musicVolume: 0.5 });

    expect(media[1]).toMatchObject({ src: "/race-music.m4a", paused: false });
  });
});
