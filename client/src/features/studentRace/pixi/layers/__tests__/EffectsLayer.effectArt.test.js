import { Container, Texture, TextureSource } from "pixi.js";
import { describe, expect, it, vi } from "vitest";

import { STUDENT_RACE_EFFECT } from "../../../runtime/studentRaceRuntimeConstants";
import { STUDENT_RACE_EFFECT_ART } from "../../assets/studentRaceEffectManifest";
import { EffectsLayer } from "../EffectsLayer";

const EFFECT_SLOTS = ["sparkle", "burstRing", "groundImpact", "dustPuff1", "dustPuff2", "dustPuff3", "confettiRect",
  "confettiRibbon", "confettiStar", "confettiDot", "smokePuff"];
const DUST_SLOTS = ["dustPuff1", "dustPuff2", "dustPuff3"];

function frame({ deltaMs = 16, visualSpeed = 0, playerDepth } = {}) {
  return {
    deltaMs,
    width: 520,
    height: 800,
    visualSpeed,
    ...(playerDepth == null ? {} : { playerDepth }),
    layout: {
      world: { bottomY: 518 },
      playerKart: { anchorX: 260, anchorY: 420, maxWidth: 177, dustOriginY: 443 },
    },
    runtimeState: { visual: { reducedMotion: false } },
  };
}

const slotArt = () => new Texture({ source: new TextureSource({ width: 128, height: 107 }) });
const painted = (graphics) => graphics.context.instructions
  .filter(({ action }) => action === "texture").map(({ data }) => data.image);

// One texture per V4 slot, so a test can tell which painting was drawn.
function loaded() {
  const textures = new Map();
  const loadTexture = vi.fn(async (url) => {
    if (!textures.has(url)) textures.set(url, slotArt());
    return textures.get(url);
  });
  const slot = (name) => textures.get(STUDENT_RACE_EFFECT_ART[name].url);
  return { loadTexture, slot };
}

describe("EffectsLayer V4 art", () => {
  it("loads and pins each V4 painting it draws once, beside the Luck art, and leaves the gate and exhaust alone", async () => {
    const { loadTexture } = loaded();
    const prepareTexture = vi.fn();
    const layer = new EffectsLayer(new Container(), { loadTexture, prepareTexture });
    await layer.artPromise;
    const urls = loadTexture.mock.calls.map(([url]) => url);

    EFFECT_SLOTS.forEach((slot) => {
      expect(urls.filter((url) => url === STUDENT_RACE_EFFECT_ART[slot].url)).toHaveLength(1);
    });
    expect(Object.keys(layer.effectArt).sort()).toEqual([...EFFECT_SLOTS].sort());
    expect(prepareTexture).toHaveBeenCalledTimes(urls.length);
    expect(urls).not.toContain(STUDENT_RACE_EFFECT_ART.turboExhaust.url);
    expect(urls).not.toContain(STUDENT_RACE_EFFECT_ART.finishGate.url);
    layer.destroy();
  });

  it("lays the dust in the world just behind the player's kart, and keeps the bursts above the world", () => {
    const effects = new Container();
    const world = new Container();
    const layer = new EffectsLayer(effects, { loadTexture: async () => null, groundContainer: world });
    layer.update(frame({ playerDepth: 0.76 }));

    expect(layer.graphics.parent).toBe(world);
    expect(layer.feedbackGraphics.parent).toBe(effects);
    expect(layer.graphics.zIndex).toBeLessThan(0.76);
    expect(layer.graphics.zIndex).toBeGreaterThan(0.7599);
    layer.destroy();
    expect(world.children).toHaveLength(0);
  });

  it("paints each dust puff with the three dust paintings in turn, and draws plain puffs without them", async () => {
    const { loadTexture, slot } = loaded();
    const layer = new EffectsLayer(new Container(), { loadTexture, prepareTexture: vi.fn() });
    const plain = new EffectsLayer(new Container(), { loadTexture: async () => { throw new Error("404"); } });
    await Promise.all([layer.artPromise, plain.artPromise]);

    [layer, plain].forEach((effects) => {
      effects.spawnPuffs(260, 443, 2, 500, 520);
      effects.drawPuffs(520);
    });

    expect(painted(layer.graphics)).toEqual(Array.from({ length: 9 }, (_, i) => slot(DUST_SLOTS[i % 3])));
    expect(painted(plain.graphics)).toEqual([]);
    expect(plain.graphics.context.instructions).toHaveLength(9);
    layer.destroy();
    plain.destroy();
  });

  it("hands the bursts their art and the ground under the kart: a wrong answer kicks its dirt up there", async () => {
    const { loadTexture, slot } = loaded();
    const world = new Container();
    const layer = new EffectsLayer(new Container(), { loadTexture, prepareTexture: vi.fn(), groundContainer: world });
    await layer.artPromise;
    layer.update(frame());

    layer.playMoments({ id: 1, moments: [{ type: STUDENT_RACE_EFFECT.WRONG, id: 41 }] });
    layer.update(frame({ deltaMs: 150 }));

    expect(painted(layer.graphics)).toEqual([slot("groundImpact")]);
    expect(painted(layer.feedbackGraphics)).not.toContain(slot("groundImpact"));
    layer.destroy();
  });
});
