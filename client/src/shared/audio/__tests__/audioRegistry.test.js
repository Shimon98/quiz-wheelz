import { describe, expect, it } from "vitest";

import { createAudioRegistry } from "../audioRegistry";

const SFX = { key: "answer-correct", kind: "sfx", url: "/correct.wav", gain: 0.8, cooldownMs: 50 };
const LOOP = { key: "hover-engine", kind: "loop", url: "/engine.wav", loopStart: 0.01, loopEnd: 2.01 };
const MUSIC = { key: "race-music", kind: "music", url: "/race.m4a" };

describe("audio registry", () => {
  it("registers descriptors and fills the defaults each kind needs", () => {
    const registry = createAudioRegistry();

    registry.register([SFX, LOOP, MUSIC]);

    expect(registry.get("answer-correct")).toMatchObject({ ...SFX, preload: true, maxVoices: 4 });
    expect(registry.get("hover-engine")).toMatchObject({ gain: 1, preload: true, loopStart: 0.01, loopEnd: 2.01 });
    expect(registry.get("race-music")).toMatchObject({ preload: false, loop: true });
    expect(registry.get("answer-correct")).not.toHaveProperty("loop");
    expect(registry.get("missing")).toBeNull();
  });

  it("lets a music track opt out of looping", () => {
    const registry = createAudioRegistry();

    registry.register([{ ...MUSIC, loop: false }]);

    expect(registry.get("race-music").loop).toBe(false);
  });

  it("accepts several manifests side by side", () => {
    const registry = createAudioRegistry();

    registry.register([SFX]);
    registry.register([LOOP, MUSIC]);

    expect(registry.list().map(({ key }) => key)).toEqual(["answer-correct", "hover-engine", "race-music"]);
  });

  it("rejects a key that is already registered with another asset", () => {
    const registry = createAudioRegistry();
    registry.register([SFX]);

    expect(() => registry.register([{ ...SFX, url: "/other.wav" }])).toThrow(/already registered/);
    expect(registry.get("answer-correct").url).toBe("/correct.wav");
  });

  it("rejects a key repeated inside one manifest and registers nothing from it", () => {
    const registry = createAudioRegistry();

    expect(() => registry.register([LOOP, SFX, { ...SFX }])).toThrow(/Duplicate/);
    expect(registry.list()).toEqual([]);
  });

  it("treats registering the identical manifest again as a no-op, as a hot reload does", () => {
    const registry = createAudioRegistry();
    registry.register([SFX, LOOP]);

    expect(() => registry.register([{ ...SFX }, { ...LOOP }])).not.toThrow();
    expect(registry.list()).toHaveLength(2);
  });

  it.each([
    ["an unknown kind", { ...SFX, kind: "turbo" }],
    ["a missing url", { ...SFX, url: "" }],
    ["a gain above 1", { ...SFX, gain: 1.2 }],
    ["zero voices", { ...SFX, maxVoices: 0 }],
    ["a loop window that ends before it starts", { ...LOOP, loopEnd: 0.005 }],
    ["a field outside the asset contract", { ...SFX, whenPlayerAnswersCorrectly: true }],
    ["a loop flag on a sound effect", { ...SFX, loop: true }],
    ["a loop flag that is not a boolean", { ...MUSIC, loop: "yes" }],
  ])("rejects %s", (_, descriptor) => {
    expect(() => createAudioRegistry().register([descriptor])).toThrow(/Invalid audio descriptor/);
  });
});
