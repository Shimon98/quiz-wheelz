import process from "node:process";
import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MantineProvider } from "@mantine/core";

import TeacherFullscreenToggle from "../TeacherFullscreenToggle";

function renderToggle(onToggle) {
  render(
    <MantineProvider>
      <TeacherFullscreenToggle fullscreen={false} onToggle={onToggle} />
    </MantineProvider>,
  );
  return screen.getByRole("button");
}

const unhandled = [];
const recordUnhandled = (reason) => unhandled.push(reason);

describe("TeacherFullscreenToggle", () => {
  afterEach(() => {
    process.off("unhandledRejection", recordUnhandled);
    unhandled.length = 0;
  });

  it("asks for fullscreen on a click", () => {
    const onToggle = vi.fn();

    fireEvent.click(renderToggle(onToggle));

    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  // A projector browser may refuse fullscreen (permissions, a frame without allowfullscreen): Mantine's toggle then
  // rejects. The refusal must not escape as an unhandled error, and the button keeps showing the real state.
  it("lets the browser refuse fullscreen without an unhandled error", async () => {
    process.on("unhandledRejection", recordUnhandled);
    // A plain function, not vi.fn().mockRejectedValue: the mock keeps its own handler on the promise it returns.
    let requests = 0;
    const onToggle = () => {
      requests += 1;
      return Promise.reject(new TypeError("not granted"));
    };
    const button = renderToggle(onToggle);

    fireEvent.click(button);
    // Node reports an unhandled rejection a little after the microtasks drain, not on the next tick.
    await new Promise((resolve) => setTimeout(resolve, 20));

    expect(requests).toBe(1);
    expect(unhandled).toEqual([]);
    expect(button).toHaveAttribute("aria-pressed", "false");
  });
});
