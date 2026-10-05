import { StrictMode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render } from "@testing-library/react";

import { audioEngine } from "../../../shared/audio";
import { FakeAudioContext, flushAudioWork } from "../../../shared/audio/audioTestFakes";
import { AUDIO_SETTINGS_DEFAULTS } from "../../../shared/audio/audioSettings";
import { useAudioSettingsStore } from "../../../stores/audioSettingsStore";
import AudioProvider from "../AudioProvider";

const tap = () => ["pointerup", "touchend", "click"].forEach((type) => {
  document.body.dispatchEvent(new Event(type, { bubbles: true }));
});
const press = (key, init = {}) => document.body.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, ...init }));

function setVisibility(state) {
  Object.defineProperty(document, "visibilityState", { configurable: true, get: () => state });
  document.dispatchEvent(new Event("visibilitychange"));
}

function stubAudioContext({ holdResume = false } = {}) {
  const contexts = [];
  vi.stubGlobal("AudioContext", class extends FakeAudioContext {
    constructor() {
      super();
      contexts.push(this);
      vi.spyOn(this, "resume");
      if (holdResume) this.resume.mockReturnValue(new Promise(() => {}));
    }
  });
  return contexts;
}

beforeEach(() => {
  useAudioSettingsStore.getState().resetAudioSettings();
});

afterEach(() => {
  audioEngine.dispose();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  setVisibility("visible");
});

describe("AudioProvider", () => {
  it("hands the stored settings to the engine on mount and on every change", () => {
    const configure = vi.spyOn(audioEngine, "configure");
    render(<AudioProvider />);

    expect(configure).toHaveBeenLastCalledWith(expect.objectContaining(AUDIO_SETTINGS_DEFAULTS));
    act(() => useAudioSettingsStore.getState().setMusicEnabled(true));

    expect(configure).toHaveBeenLastCalledWith(expect.objectContaining({ musicEnabled: true }));
  });

  it("unlocks on every activation gesture, ignoring key auto-repeat and Escape", () => {
    const unlock = vi.spyOn(audioEngine, "unlock").mockResolvedValue(undefined);
    render(<AudioProvider />);

    press("Enter", { repeat: true });
    press("Escape");
    document.body.dispatchEvent(new Event("pointermove", { bubbles: true }));
    expect(unlock).not.toHaveBeenCalled();

    tap();
    press("Enter");
    expect(unlock).toHaveBeenCalledTimes(4);
  });

  it("starts the audio context once for the three events of one tap", () => {
    const contexts = stubAudioContext({ holdResume: true });
    render(<AudioProvider />);

    tap();

    expect(contexts).toHaveLength(1);
    expect(contexts[0].resume).toHaveBeenCalledTimes(1);
  });

  it("keeps listening after a refused resume, so the next gesture recovers the context", async () => {
    const contexts = stubAudioContext();
    render(<AudioProvider />);
    tap();
    const [context] = contexts;
    context.resumeError = new DOMException("Interrupted", "InvalidStateError");
    context.setState("interrupted");
    await flushAudioWork();

    press("Enter");
    await flushAudioWork();
    context.resumeError = null;
    tap();
    await flushAudioWork();

    expect(context.resume).toHaveBeenCalledTimes(3);
    expect(audioEngine.getState().status).toBe("running");
  });

  it("suspends while the page is hidden and resumes when it returns", () => {
    const suspend = vi.spyOn(audioEngine, "suspend");
    const resume = vi.spyOn(audioEngine, "resume");
    render(<AudioProvider />);

    setVisibility("hidden");
    expect(suspend).toHaveBeenCalledTimes(1);
    setVisibility("visible");
    expect(resume).toHaveBeenCalledTimes(1);
  });

  it("keeps one subscription, one listener set and one context through StrictMode, and never disposes the engine", () => {
    const contexts = stubAudioContext({ holdResume: true });
    const configure = vi.spyOn(audioEngine, "configure");
    const unlock = vi.spyOn(audioEngine, "unlock");
    const suspend = vi.spyOn(audioEngine, "suspend");
    const dispose = vi.spyOn(audioEngine, "dispose");
    const { unmount } = render(
      <StrictMode>
        <AudioProvider />
      </StrictMode>,
    );

    configure.mockClear();
    act(() => useAudioSettingsStore.getState().setSfxEnabled(false));
    press("Enter");
    expect(configure).toHaveBeenCalledTimes(1);
    expect(unlock).toHaveBeenCalledTimes(1);
    expect(contexts).toHaveLength(1);
    unmount();
    tap();
    setVisibility("hidden");

    expect(unlock).toHaveBeenCalledTimes(1);
    expect(suspend).not.toHaveBeenCalled();
    expect(dispose).not.toHaveBeenCalled();
  });
});
