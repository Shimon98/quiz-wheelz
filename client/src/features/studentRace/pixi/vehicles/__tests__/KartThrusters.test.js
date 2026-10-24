import { Container, Texture, TextureSource } from "pixi.js";
import { describe, expect, it } from "vitest";

import { KART_THRUSTER_CONFIG, KART_THRUSTER_PALETTES } from "../../../config/kartThrusterConfig";
import { STUDENT_RACE_EFFECT } from "../../../runtime/studentRaceRuntimeConstants";
import { STUDENT_RACE_VEHICLE_MANIFEST } from "../../assets/studentRaceVehicleManifest";
import { KartThrusters } from "../KartThrusters";
import { artPixelToKartLocal } from "../studentRaceVehicleGeometry";

const ART = { width: 768, height: 768 };
const GREEN = STUDENT_RACE_VEHICLE_MANIFEST.TOY_CAR_GREEN;

function placed() {
  const kart = new Container();
  const thrusters = new KartThrusters(kart);
  thrusters.place(GREEN, ART);
  return { kart, thrusters };
}

function step(thrusters, { deltaMs = 16, palette = null, reducedMotion = false } = {}) {
  thrusters.update({ deltaMs, palette, reducedMotion });
}

describe("KartThrusters", () => {
  it("maps the measured art pixels into the kart's local space like the art sprite", () => {
    const left = artPixelToKartLocal(GREEN.thrusters[0], ART, GREEN);
    const right = artPixelToKartLocal(GREEN.thrusters[1], ART, GREEN);

    expect(left.x).toBeCloseTo(18.7, 1);
    expect(left.y).toBeCloseTo(37.21, 1);
    expect(right.x).toBeCloseTo(81.0, 1);
    expect(right.y).toBeCloseTo(37.11, 1);
  });

  it("sits inside the kart container, so it bobs and tilts with the art", () => {
    const { kart, thrusters } = placed();

    expect(thrusters.container.parent).toBe(kart);
    expect(thrusters.steady.nozzles.map((n) => [Math.round(n.container.x), Math.round(n.container.y)]))
      .toEqual([[19, 37], [81, 37]]);
  });

  it("stays hidden until it is placed on real art, and after the art is cleared", () => {
    const thrusters = new KartThrusters(new Container());
    step(thrusters, { palette: KART_THRUSTER_PALETTES.turbo, deltaMs: 500 });
    expect(thrusters.container.visible).toBe(false);

    thrusters.place(GREEN, ART);
    step(thrusters, { palette: KART_THRUSTER_PALETTES.turbo, deltaMs: 500 });
    expect(thrusters.container.visible).toBe(true);

    thrusters.clear();
    step(thrusters, { palette: KART_THRUSTER_PALETTES.turbo });
    expect(thrusters.container.visible).toBe(false);
  });

  it("fades a mode glow in and out instead of popping", () => {
    const { thrusters } = placed();

    step(thrusters, { palette: KART_THRUSTER_PALETTES.turbo, deltaMs: KART_THRUSTER_CONFIG.fadeInMs / 2 });
    expect(thrusters.level).toBeCloseTo(0.5, 2);
    step(thrusters, { palette: KART_THRUSTER_PALETTES.turbo, deltaMs: KART_THRUSTER_CONFIG.fadeInMs });
    expect(thrusters.level).toBe(1);

    step(thrusters, { palette: null, deltaMs: KART_THRUSTER_CONFIG.fadeOutMs / 2 });
    expect(thrusters.level).toBeCloseTo(0.5, 2);
    expect(thrusters.palette).toBe(KART_THRUSTER_PALETTES.turbo);
    step(thrusters, { palette: null, deltaMs: KART_THRUSTER_CONFIG.fadeOutMs });
    expect(thrusters.level).toBe(0);
    expect(thrusters.palette).toBeNull();
    expect(thrusters.container.visible).toBe(false);
  });

  it("flickers Turbo flames without spinning them, and holds them still under reduced motion", () => {
    const { thrusters } = placed();
    const flames = () => thrusters.steady.nozzles[0].tongues;

    step(thrusters, { palette: KART_THRUSTER_PALETTES.turbo, deltaMs: 300 });
    const first = flames().scale.x;
    step(thrusters, { palette: KART_THRUSTER_PALETTES.turbo, deltaMs: 40 });
    expect(flames().scale.x).not.toBeCloseTo(first, 3);
    expect(flames().rotation).toBe(0);

    step(thrusters, { palette: KART_THRUSTER_PALETTES.turbo, deltaMs: 40, reducedMotion: true });
    const still = flames().scale.x;
    step(thrusters, { palette: KART_THRUSTER_PALETTES.turbo, deltaMs: 40, reducedMotion: true });
    expect(flames().scale.x).toBe(still);
  });

  it.each([
    [STUDENT_RACE_EFFECT.TURBO_SUCCESS, KART_THRUSTER_PALETTES.turboBurst],
    [STUDENT_RACE_EFFECT.TURBO_FAILURE, KART_THRUSTER_PALETTES.off],
    [STUDENT_RACE_EFFECT.SAFE_COMPLETE, KART_THRUSTER_PALETTES.safe],
    [STUDENT_RACE_EFFECT.SAFE_PERFECT, KART_THRUSTER_PALETTES.safePerfect],
  ])("plays the %s one-shot once with its own look, then clears it", (type, palette) => {
    const { thrusters } = placed();
    step(thrusters);

    thrusters.play(type);
    step(thrusters);
    expect(thrusters.oneShot.type).toBe(type);
    expect(thrusters.burst.palette).toBe(palette);
    expect(thrusters.container.visible).toBe(true);

    step(thrusters, { deltaMs: KART_THRUSTER_CONFIG.oneShots[type].durationMs });
    expect(thrusters.oneShot).toBeNull();
    expect(thrusters.burst.palette).toBeNull();
    expect(thrusters.container.visible).toBe(false);
  });

  it("burns flame tongues in the Turbo glow and its success burst, never in Safe", () => {
    const hasTongues = (group) => group.nozzles.every(({ tongues }) => tongues.context.instructions.length > 0);
    const { thrusters } = placed();
    step(thrusters, { palette: KART_THRUSTER_PALETTES.safe, deltaMs: 300 });
    expect(hasTongues(thrusters.steady)).toBe(false);

    step(thrusters, { palette: KART_THRUSTER_PALETTES.turbo, deltaMs: 300 });
    expect(hasTongues(thrusters.steady)).toBe(true);

    thrusters.play(STUDENT_RACE_EFFECT.TURBO_SUCCESS);
    step(thrusters, { palette: KART_THRUSTER_PALETTES.turbo });
    expect(hasTongues(thrusters.burst)).toBe(true);
  });

  it("aims the Turbo flames at the camera: they reach further down than up or sideways", () => {
    const { thrusters } = placed();
    step(thrusters, { palette: KART_THRUSTER_PALETTES.turbo, deltaMs: 300 });
    const { minX, minY, maxX, maxY } = thrusters.steady.nozzles[0].tongues.context.bounds;

    expect(maxY).toBeGreaterThan(-minY * 1.4);
    expect(maxY).toBeGreaterThan(Math.max(-minX, maxX) * 1.4);
  });

  const peaks = (type) => {
    const { thrusters } = placed();
    step(thrusters);
    thrusters.play(type);
    const peak = { halo: 0, flames: 0 };
    for (let elapsed = 0; elapsed < KART_THRUSTER_CONFIG.oneShots[type].durationMs; elapsed += 16) {
      step(thrusters);
      if (!thrusters.oneShot) break;
      peak.halo = Math.max(peak.halo, thrusters.burst.nozzles[0].halo.scale.x);
      peak.flames = Math.max(peak.flames, thrusters.burst.nozzles[0].tongues.scale.x);
    }
    return peak;
  };

  it("grows the Turbo success flames without washing the kart in glow", () => {
    const turbo = peaks(STUDENT_RACE_EFFECT.TURBO_SUCCESS);

    expect(turbo.flames).toBeGreaterThanOrEqual(1.4);
    expect(turbo.halo).toBeLessThanOrEqual(1.5);
  });

  it("keeps the Safe Perfect burst small, so the kart stays visible", () => {
    expect(peaks(STUDENT_RACE_EFFECT.SAFE_PERFECT).halo).toBeLessThanOrEqual(1.12);
  });

  it.each([STUDENT_RACE_EFFECT.SAFE_COMPLETE, STUDENT_RACE_EFFECT.SAFE_PERFECT])(
    "keeps %s blue and contained, with a gentle attack and release", (type) => {
      const { thrusters } = placed();
      step(thrusters);
      thrusters.play(type);
      const duration = KART_THRUSTER_CONFIG.oneShots[type].durationMs;
      step(thrusters, { deltaMs: 0 });
      expect(thrusters.burst.container.alpha).toBe(0);
      step(thrusters, { deltaMs: duration / 2 });
      expect(thrusters.burst.container.alpha).toBeGreaterThan(0);
      expect(thrusters.burst.container.alpha).toBeLessThanOrEqual(0.65);
      for (const nozzle of thrusters.burst.nozzles) {
        expect(nozzle.rays.context.instructions).toHaveLength(0);
        expect(nozzle.halo.context.instructions).toHaveLength(0);
        expect(nozzle.tongues.context.instructions).toHaveLength(0);
        expect(nozzle.flame.visible).toBe(false);
        expect(nozzle.core.scale.x).toBeLessThanOrEqual(1.03);
      }
      step(thrusters, { deltaMs: duration / 2 - 1 });
      expect(thrusters.burst.container.alpha).toBeLessThan(0.001);
      step(thrusters, { deltaMs: 1 });
      expect(thrusters.oneShot).toBeNull();
    },
  );

  it("ignores one-shots under reduced motion, unrelated moments, and lets the finish stop them", () => {
    const { thrusters } = placed();
    step(thrusters, { reducedMotion: true });
    thrusters.play(STUDENT_RACE_EFFECT.TURBO_SUCCESS);
    expect(thrusters.oneShot).toBeNull();

    step(thrusters);
    thrusters.play(STUDENT_RACE_EFFECT.CORRECT);
    expect(thrusters.oneShot).toBeNull();

    thrusters.play(STUDENT_RACE_EFFECT.TURBO_SUCCESS);
    thrusters.play(STUDENT_RACE_EFFECT.FINISH);
    expect(thrusters.oneShot).toBeNull();
  });

  it("never shows without measured thrusters on the art", () => {
    const thrusters = new KartThrusters(new Container());
    thrusters.place({ ...GREEN, thrusters: undefined }, ART);
    step(thrusters, { palette: KART_THRUSTER_PALETTES.safe, deltaMs: 500 });

    expect(thrusters.container.visible).toBe(false);
  });

  it("uses painted exhaust when loaded, without stacking the fallback or steady light under a burst", async () => {
    const { thrusters } = placed();
    const texture = new Texture({ source: new TextureSource({ width: 192, height: 288 }) });
    expect(await thrusters.loadArt(async () => texture)).toBe(true);
    step(thrusters, { palette: KART_THRUSTER_PALETTES.turbo, deltaMs: 300 });
    expect(thrusters.steady.nozzles[0].flame.visible).toBe(true);
    expect(thrusters.steady.nozzles[0].tongues.visible).toBe(false);
    thrusters.play(STUDENT_RACE_EFFECT.TURBO_SUCCESS);
    step(thrusters, { palette: KART_THRUSTER_PALETTES.turbo });
    expect(thrusters.steady.container.alpha).toBe(0);
    expect(thrusters.burst.nozzles[0].flame.visible).toBe(true);
    thrusters.destroy();
  });

  it("keeps a usable fallback on asset failure and ignores a load after destruction", async () => {
    const { thrusters } = placed();
    expect(await thrusters.loadArt(async () => { throw new Error("offline"); })).toBe(false);
    step(thrusters, { palette: KART_THRUSTER_PALETTES.turbo, deltaMs: 300 });
    expect(thrusters.steady.nozzles[0].tongues.visible).toBe(true);
    thrusters.destroy();
    const late = placed().thrusters;
    let resolve;
    const loading = late.loadArt(() => new Promise((done) => { resolve = done; }));
    await Promise.resolve();
    late.destroy();
    resolve(Texture.EMPTY);
    expect(await loading).toBe(false);
  });
});
