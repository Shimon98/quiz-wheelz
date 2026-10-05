import { afterEach, describe, expect, it, vi } from "vitest";

import { createAudioLoader } from "../audioLoader";
import { FakeAudioContext, createFakeAudioFetch } from "../audioTestFakes";

const URL = "/assets/answer-correct.wav";
const LOAD_FAILURE = `Audio asset failed to load: ${URL}`;

function setup(fetchImpl = createFakeAudioFetch()) {
  const context = new FakeAudioContext();
  const decode = vi.spyOn(context, "decodeAudioData");
  return { loader: createAudioLoader({ fetchImpl }), context, decode, fetchImpl };
}

afterEach(() => {
  vi.useRealTimers();
});

describe("audio loader", () => {
  it("serves five simultaneous requests with one download and one decode", async () => {
    const { loader, context, decode, fetchImpl } = setup();

    const buffers = await Promise.all(Array.from({ length: 5 }, () => loader.loadBuffer(context, URL)));

    expect(new Set(buffers).size).toBe(1);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(decode).toHaveBeenCalledTimes(1);
    expect(loader.getBuffer(URL)).toBe(buffers[0]);
  });

  it("reuses the decoded buffer instead of downloading again", async () => {
    const { loader, context, fetchImpl } = setup();

    await loader.loadBuffer(context, URL);
    await loader.loadBuffer(context, URL);

    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("decodes prefetched bytes later without a second download", async () => {
    const { loader, context, fetchImpl } = setup();

    loader.prefetch(URL);
    await loader.loadBuffer(context, URL);

    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("reports a controlled error and downloads again on the next request", async () => {
    const fetchImpl = createFakeAudioFetch();
    fetchImpl.mockRejectedValueOnce(new TypeError("Failed to fetch"));
    const { loader, context } = setup(fetchImpl);

    await expect(loader.loadBuffer(context, URL)).rejects.toThrow(LOAD_FAILURE);
    await expect(loader.loadBuffer(context, URL)).resolves.toBeTruthy();
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("never decodes the same bytes twice, because decoding detaches them", async () => {
    const { loader, context, decode, fetchImpl } = setup();
    decode.mockRejectedValueOnce(new DOMException("Unable to decode", "EncodingError"));

    await expect(loader.loadBuffer(context, URL)).rejects.toThrow(LOAD_FAILURE);
    await expect(loader.loadBuffer(context, URL)).resolves.toBeTruthy();
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("gives up on a request that hangs past the timeout", async () => {
    vi.useFakeTimers();
    const hangingFetch = vi.fn((_, { signal }) => new Promise((_resolve, reject) => {
      signal.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")));
    }));
    const { loader, context } = setup(hangingFetch);

    const loading = loader.loadBuffer(context, URL);
    const settled = expect(loading).rejects.toThrow(LOAD_FAILURE);
    await vi.advanceTimersByTimeAsync(10_000);

    await settled;
  });

  it("rejects an HTML answer, such as a hosting fallback page, as a load error", async () => {
    const { loader, context, decode } = setup(createFakeAudioFetch({ contentType: "text/html; charset=utf-8" }));

    await expect(loader.loadBuffer(context, URL)).rejects.toThrow(LOAD_FAILURE);
    expect(decode).not.toHaveBeenCalled();
  });

  it("forgets everything on clear and downloads again afterwards", async () => {
    const { loader, context, fetchImpl } = setup();
    await loader.loadBuffer(context, URL);

    loader.clear();
    expect(loader.getBuffer(URL)).toBeNull();
    await loader.loadBuffer(context, URL);

    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });
});
