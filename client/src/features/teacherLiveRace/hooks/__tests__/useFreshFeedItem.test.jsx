import { describe, expect, it } from "vitest";
import { renderHook } from "@testing-library/react";

import useFreshFeedItem from "../useFreshFeedItem";

const item = (id, kind = "CORRECT_ANSWER") => ({ id, kind });

describe("useFreshFeedItem", () => {
  it("ignores the feed that was already on screen when the projector mounted", () => {
    const { result } = renderHook(({ items }) => useFreshFeedItem(items), {
      initialProps: { items: [item("12:RANK_UP:2", "RANK_UP"), item("11:CORRECT_ANSWER:1")] },
    });

    expect(result.current).toBeNull();
  });

  it("returns each newest item that arrives after mount, once per new id", () => {
    const { result, rerender } = renderHook(({ items }) => useFreshFeedItem(items), {
      initialProps: { items: [] },
    });

    const first = item("13:CORRECT_ANSWER:1");
    rerender({ items: [first] });
    expect(result.current).toBe(first);

    const second = item("14:PLAYER_FINISHED:2", "PLAYER_FINISHED");
    rerender({ items: [second, first] });
    expect(result.current).toBe(second);
  });

  it("stays quiet when the feed resets to the mount baseline or empties", () => {
    const baseline = item("10:CORRECT_ANSWER:1");
    const { result, rerender } = renderHook(({ items }) => useFreshFeedItem(items), {
      initialProps: { items: [baseline] },
    });

    rerender({ items: [baseline] });
    expect(result.current).toBeNull();

    rerender({ items: [] });
    expect(result.current).toBeNull();
  });
});
