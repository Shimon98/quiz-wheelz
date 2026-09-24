import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render } from "@testing-library/react";

import BrandLockup from "../BrandLockup";

const BRAND = "QuizWheelz";
const MID_FIRST_SCRAMBLE_MS = 460;
const FIRST_SCRAMBLE_SETTLED_MS = 2000;

function advance(ms) {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
}

function readCells(container) {
  return [...container.querySelectorAll("[data-shuffle-character]")];
}

function scramblingCells(container) {
  return readCells(container).filter((cell) => cell.children.length > 1);
}

beforeEach(() => {
  vi.useFakeTimers({
    toFake: ["setTimeout", "clearTimeout", "setInterval", "clearInterval", "performance", "Date"],
  });
  vi.spyOn(Math, "random").mockReturnValue(0);
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("BrandLockup shuffle", () => {
  it("reserves the width of the real glyph in every character cell while it scrambles", () => {
    const { container } = render(<BrandLockup />);

    advance(MID_FIRST_SCRAMBLE_MS);

    const scrambling = scramblingCells(container);
    expect(scrambling.length).toBeGreaterThan(0);
    expect(readCells(container).map((cell) => cell.firstElementChild.textContent).join("")).toBe(BRAND);
    for (const cell of scrambling) {
      expect(cell).toHaveClass("inline-block");
      expect(cell.firstElementChild).toHaveClass("invisible");
      expect(cell.lastElementChild).toHaveClass("absolute");
      expect(cell.lastElementChild.textContent).toBe("A");
    }

    advance(FIRST_SCRAMBLE_SETTLED_MS);

    expect(scramblingCells(container)).toHaveLength(0);
    expect(container.textContent).toBe(BRAND);
  });

  it("does not restart the shuffle when its parent re-renders", () => {
    const { container, rerender } = render(<BrandLockup />);
    advance(FIRST_SCRAMBLE_SETTLED_MS);

    for (let renderIndex = 0; renderIndex < 6; renderIndex += 1) {
      rerender(<BrandLockup />);
      advance(500);
      expect(scramblingCells(container)).toHaveLength(0);
    }
  });

  it("waits ten seconds between automatic replays by default", () => {
    const { container } = render(<BrandLockup />);
    advance(FIRST_SCRAMBLE_SETTLED_MS);

    advance(6400);
    expect(scramblingCells(container)).toHaveLength(0);

    advance(3600);
    expect(scramblingCells(container).length).toBeGreaterThan(0);
  });

  it("honors a longer replay interval from the caller", () => {
    const { container } = render(<BrandLockup shuffleIntervalMs={30_000} />);
    advance(FIRST_SCRAMBLE_SETTLED_MS);

    advance(27_000);
    expect(scramblingCells(container)).toHaveLength(0);

    advance(3000);
    expect(scramblingCells(container).length).toBeGreaterThan(0);
  });
});
