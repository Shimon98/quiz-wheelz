import { describe, expect, it } from "vitest";

import { createAudioCuePolicy } from "../audioCuePolicy";
import { AUDIO_PLAY_RESULTS } from "../audioTypes";

const CUE = { cooldownMs: 100, maxVoices: 2 };

describe("audio cue policy", () => {
  it("blocks a repeat inside the cooldown and allows it after", () => {
    const policy = createAudioCuePolicy();

    expect(policy.acquire("ding", 0, CUE)).toBeNull();
    expect(policy.acquire("ding", 99, CUE)).toBe(AUDIO_PLAY_RESULTS.COOLDOWN);
    expect(policy.acquire("ding", 100, CUE)).toBeNull();
  });

  it("caps overlapping voices until one ends", () => {
    const policy = createAudioCuePolicy();
    const noCooldown = { ...CUE, cooldownMs: 0 };

    policy.acquire("ding", 0, noCooldown);
    policy.acquire("ding", 0, noCooldown);
    expect(policy.acquire("ding", 0, noCooldown)).toBe(AUDIO_PLAY_RESULTS.VOICE_LIMIT);

    policy.release("ding");
    expect(policy.acquire("ding", 0, noCooldown)).toBeNull();
  });

  it("keeps every cue independent", () => {
    const policy = createAudioCuePolicy();

    policy.acquire("ding", 0, CUE);

    expect(policy.acquire("whoosh", 0, CUE)).toBeNull();
  });
});
