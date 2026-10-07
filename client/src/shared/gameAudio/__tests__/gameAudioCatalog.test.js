import { describe, expect, it } from "vitest";

import { AUDIO_KINDS } from "../../audio";
import { createAudioEngine } from "../../audio/audioEngine";
import { createFakeAudioFetch, FakeAudioContext } from "../../audio/audioTestFakes";
import { createAudioLoader } from "../../audio/audioLoader";
import { GAME_AUDIO, GAME_AUDIO_MANIFEST } from "../gameAudioCatalog";

const EXTENSIONS = { [AUDIO_KINDS.MUSIC]: ".m4a", [AUDIO_KINDS.SFX]: ".wav", [AUDIO_KINDS.LOOP]: ".wav" };

describe("game audio catalog", () => {
  it("describes every key exactly once, with an imported asset of the agreed format", () => {
    const keys = GAME_AUDIO_MANIFEST.map(({ key }) => key);

    expect(new Set(keys).size).toBe(keys.length);
    expect([...keys].sort()).toEqual(Object.values(GAME_AUDIO).sort());
    GAME_AUDIO_MANIFEST.forEach(({ kind, url }) => {
      expect(url).toMatch(/\/assets\/audio\//);
      expect(url.endsWith(EXTENSIONS[kind])).toBe(true);
    });
  });

  it("gives every physical file a single owner", () => {
    const urls = GAME_AUDIO_MANIFEST.map(({ url }) => url);

    expect(new Set(urls).size).toBe(urls.length);
  });

  it("passes the engine's descriptor validation and can be registered again safely", () => {
    const engine = createAudioEngine({ createContext: () => new FakeAudioContext() });

    expect(() => engine.register(GAME_AUDIO_MANIFEST)).not.toThrow();
    expect(() => engine.register(GAME_AUDIO_MANIFEST)).not.toThrow();
  });

  it("preloads the short sounds and never downloads music up front", () => {
    const fetchImpl = createFakeAudioFetch();
    const engine = createAudioEngine({
      createContext: () => new FakeAudioContext(),
      loader: createAudioLoader({ fetchImpl }),
    });
    engine.register(GAME_AUDIO_MANIFEST);

    engine.preload();

    const fetched = fetchImpl.mock.calls.map(([url]) => url);
    const shortUrls = GAME_AUDIO_MANIFEST.filter(({ kind }) => kind !== AUDIO_KINDS.MUSIC).map(({ url }) => url);
    expect(fetched.sort()).toEqual(shortUrls.sort());
  });

  it("keeps the mix relationship: music and engine stay under the effects, wrong stays under correct", () => {
    const gain = (key) => GAME_AUDIO_MANIFEST.find((descriptor) => descriptor.key === key).gain;

    expect(gain(GAME_AUDIO.HOVER_ENGINE)).toBeLessThan(gain(GAME_AUDIO.ANSWER_WRONG));
    expect(gain(GAME_AUDIO.ANSWER_WRONG)).toBeLessThan(gain(GAME_AUDIO.ANSWER_CORRECT));
    expect(gain(GAME_AUDIO.ANSWER_CORRECT)).toBeLessThan(gain(GAME_AUDIO.RACE_FINISH));
    expect(GAME_AUDIO_MANIFEST.every((descriptor) => descriptor.gain < 1)).toBe(true);
  });
});
