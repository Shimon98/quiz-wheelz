import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const STORAGE_KEY = "qw-audio";
const DEFAULTS = { musicEnabled: false, sfxEnabled: true, musicVolume: 0.6, sfxVolume: 0.75 };

async function loadStore() {
  vi.resetModules();
  const { useAudioSettingsStore } = await import("../audioSettingsStore");
  return useAudioSettingsStore;
}

const settingsOf = (store) => {
  const { musicEnabled, sfxEnabled, musicVolume, sfxVolume } = store.getState();
  return { musicEnabled, sfxEnabled, musicVolume, sfxVolume };
};

const stored = () => JSON.parse(window.localStorage.getItem(STORAGE_KEY));

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("audio settings store", () => {
  it("starts with music off and sound effects on", async () => {
    expect(settingsOf(await loadStore())).toEqual(DEFAULTS);
  });

  it("hydrates every valid stored field", async () => {
    const saved = { musicEnabled: true, sfxEnabled: false, musicVolume: 0.2, sfxVolume: 1 };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));

    expect(settingsOf(await loadStore())).toEqual(saved);
  });

  it("falls back to the defaults when the stored JSON is broken", async () => {
    window.localStorage.setItem(STORAGE_KEY, "{not json");

    expect(settingsOf(await loadStore())).toEqual(DEFAULTS);
  });

  it("keeps the valid fields of a partly corrupt object and defaults the rest", async () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
      musicEnabled: true,
      sfxEnabled: "yes",
      musicVolume: 1.5,
      sfxVolume: 0.3,
    }));

    expect(settingsOf(await loadStore())).toEqual({ musicEnabled: true, sfxEnabled: true, musicVolume: 0.6, sfxVolume: 0.3 });
  });

  it("persists valid changes and ignores invalid ones", async () => {
    const store = await loadStore();

    store.getState().setMusicEnabled(true);
    store.getState().setSfxVolume(0.4);
    store.getState().setMusicVolume(-0.1);
    store.getState().setSfxEnabled(1);
    store.getState().setMusicVolume(Number.NaN);

    const expected = { ...DEFAULTS, musicEnabled: true, sfxVolume: 0.4 };
    expect(settingsOf(store)).toEqual(expected);
    expect(stored()).toEqual(expected);
  });

  it("keeps music and sound effects independent across reloads", async () => {
    let store = await loadStore();
    store.getState().setMusicEnabled(true);
    store.getState().setSfxEnabled(false);

    store = await loadStore();
    expect(settingsOf(store)).toMatchObject({ musicEnabled: true, sfxEnabled: false });
    store.getState().setMusicEnabled(false);

    store = await loadStore();
    expect(settingsOf(store)).toMatchObject({ musicEnabled: false, sfxEnabled: false });
  });

  it("resets to the defaults and persists them", async () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ musicEnabled: true, sfxEnabled: false, musicVolume: 0, sfxVolume: 0 }));
    const store = await loadStore();

    store.getState().resetAudioSettings();

    expect(settingsOf(store)).toEqual(DEFAULTS);
    expect(stored()).toEqual(DEFAULTS);
  });

  it("keeps working in memory when localStorage is blocked", async () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    const store = await loadStore();

    store.getState().setSfxEnabled(false);

    expect(settingsOf(store)).toEqual({ ...DEFAULTS, sfxEnabled: false });
  });
});
