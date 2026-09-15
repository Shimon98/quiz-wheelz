import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import useEventSourceStream, { EVENT_SOURCE_READY_STATES } from "../useEventSourceStream";

function fakeSource() {
  return { readyState: EVENT_SOURCE_READY_STATES.CONNECTING, close: vi.fn() };
}

function renderStream(initialProps) {
  const sources = [];
  const createSource = vi.fn(() => {
    const source = fakeSource();
    sources.push(source);
    return source;
  });
  const hook = renderHook((props) => useEventSourceStream({ createSource, ...props }), {
    initialProps: { enabled: true, generation: 0, ...initialProps },
  });
  return { ...hook, createSource, sources };
}

describe("useEventSourceStream", () => {
  it("opens once and does not recreate when callbacks or unrelated props change", () => {
    const { rerender, createSource } = renderStream({ onMessage: vi.fn() });

    rerender({ enabled: true, generation: 0, onMessage: vi.fn() });
    rerender({ enabled: true, generation: 0, onMessage: vi.fn(), afterVersion: 99 });

    expect(createSource).toHaveBeenCalledTimes(1);
  });

  it("recreates on generation change and closes the previous source", () => {
    const { rerender, createSource, sources } = renderStream();

    rerender({ enabled: true, generation: 1 });

    expect(createSource).toHaveBeenCalledTimes(2);
    expect(sources[0].close).toHaveBeenCalledTimes(1);
    expect(sources[1].close).not.toHaveBeenCalled();
  });

  it("closes when disabled and on unmount", () => {
    const { rerender, unmount, sources } = renderStream();

    rerender({ enabled: false, generation: 0 });
    expect(sources[0].close).toHaveBeenCalledTimes(1);

    rerender({ enabled: true, generation: 0 });
    unmount();
    expect(sources[1].close).toHaveBeenCalledTimes(1);
  });

  it("forwards open, message and error with the source ready state without closing", () => {
    const onOpen = vi.fn();
    const onMessage = vi.fn();
    const onError = vi.fn();
    const { sources } = renderStream({ onOpen, onMessage, onError });
    const source = sources[0];

    source.readyState = EVENT_SOURCE_READY_STATES.OPEN;
    act(() => source.onopen());
    act(() => source.onmessage({ data: "{}" }));
    source.readyState = EVENT_SOURCE_READY_STATES.CONNECTING;
    act(() => source.onerror());

    expect(onOpen).toHaveBeenCalledWith({ readyState: EVENT_SOURCE_READY_STATES.OPEN });
    expect(onMessage).toHaveBeenCalledWith({ data: "{}" });
    expect(onError).toHaveBeenCalledWith({ readyState: EVENT_SOURCE_READY_STATES.CONNECTING });
    expect(source.close).not.toHaveBeenCalled();
  });

  it("uses the latest callbacks and ignores late callbacks after cleanup", () => {
    const firstMessage = vi.fn();
    const secondMessage = vi.fn();
    const { rerender, sources } = renderStream({ onMessage: firstMessage });
    const source = sources[0];
    const lateMessage = source.onmessage;

    rerender({ enabled: true, generation: 0, onMessage: secondMessage });
    act(() => lateMessage({ data: "a" }));
    expect(firstMessage).not.toHaveBeenCalled();
    expect(secondMessage).toHaveBeenCalledWith({ data: "a" });

    rerender({ enabled: false, generation: 0, onMessage: secondMessage });
    act(() => lateMessage({ data: "b" }));
    expect(secondMessage).toHaveBeenCalledTimes(1);
  });

  it("reports a source creation failure as a closed stream", () => {
    const onError = vi.fn();
    const failure = new Error("unavailable");
    renderHook(() =>
      useEventSourceStream({
        enabled: true,
        createSource: () => {
          throw failure;
        },
        onError,
      }),
    );

    expect(onError).toHaveBeenCalledWith({
      error: failure,
      readyState: EVENT_SOURCE_READY_STATES.CLOSED,
    });
  });
});
