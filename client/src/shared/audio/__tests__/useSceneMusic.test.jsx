import { StrictMode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";

import { audioEngine } from "../audioEngine";
import { setupAudioEngine } from "../audioTestFakes";
import useSceneMusic from "../useSceneMusic";

function Scene({ musicKey, gain }) {
  useSceneMusic(musicKey, gain);
  return null;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("useSceneMusic", () => {
  it("claims the scene track on mount and releases its own claim on unmount", () => {
    const claim = vi.spyOn(audioEngine, "claimMusic").mockReturnValue(7);
    const release = vi.spyOn(audioEngine, "releaseMusic").mockImplementation(() => {});
    const { unmount } = render(<Scene musicKey="music-race" gain={0.5} />);

    expect(claim).toHaveBeenCalledWith("music-race", { gain: 0.5 });
    unmount();

    expect(release).toHaveBeenCalledWith(7);
  });

  it("does not claim again when the scene re-renders with the same track", () => {
    const claim = vi.spyOn(audioEngine, "claimMusic").mockReturnValue(1);
    vi.spyOn(audioEngine, "releaseMusic").mockImplementation(() => {});
    const { rerender } = render(<Scene musicKey="music-race" gain={0.5} />);

    rerender(<Scene musicKey="music-race" gain={0.5} />);

    expect(claim).toHaveBeenCalledTimes(1);
  });

  it("hands over from one scene to the next and claims nothing for a silent scene", () => {
    let owner = 0;
    const claim = vi.spyOn(audioEngine, "claimMusic").mockImplementation(() => {
      owner += 1;
      return owner;
    });
    const release = vi.spyOn(audioEngine, "releaseMusic").mockImplementation(() => {});
    const { rerender } = render(<Scene musicKey="music-game" />);

    rerender(<Scene musicKey="music-race" />);
    rerender(<Scene musicKey={null} />);

    expect(claim.mock.calls.map(([key]) => key)).toEqual(["music-game", "music-race"]);
    expect(release.mock.calls.map(([token]) => token)).toEqual([1, 2]);
  });

  it("ends StrictMode's double mount with exactly one live claim", () => {
    let owner = 0;
    vi.spyOn(audioEngine, "claimMusic").mockImplementation(() => {
      owner += 1;
      return owner;
    });
    const release = vi.spyOn(audioEngine, "releaseMusic").mockImplementation(() => {});

    render(
      <StrictMode>
        <Scene musicKey="music-race" />
      </StrictMode>,
    );

    expect(owner).toBe(2);
    expect(release.mock.calls).toEqual([[1]]);
  });

  it("keeps the scene mounted when the browser cannot route its music, and plays it on the next sync", async () => {
    const { engine, contexts, media } = setupAudioEngine();
    engine.configure({ musicEnabled: true });
    await engine.unlock();
    vi.spyOn(audioEngine, "claimMusic").mockImplementation(engine.claimMusic);
    vi.spyOn(audioEngine, "releaseMusic").mockImplementation(engine.releaseMusic);
    contexts[0].createMediaElementSource = () => {
      throw new Error("media routing failed");
    };

    render(<Scene musicKey="race" />);
    delete contexts[0].createMediaElementSource;
    await engine.resume();

    expect(media).toHaveLength(2);
    expect(media[1]).toMatchObject({ src: "/race-music.m4a", paused: false });
  });
});
