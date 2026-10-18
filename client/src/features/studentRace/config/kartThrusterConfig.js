import { STUDENT_RACE_EFFECT } from "../runtime/studentRaceRuntimeConstants.js";

// Player-only thruster light for the server's challenge modes and results. Pure
// presentation: it never feeds speed, movement or score.
export const KART_THRUSTER_PALETTES = Object.freeze({
  // Painted exhaust carries the flame; the nozzle light stays inside its housing.
  turbo: Object.freeze({
    rim: 0xd97128, body: 0xf6b34d, hot: 0xffe6a6, halo: null, rays: null, tongues: 0xed7b27, tongueCore: 0xffd778,
  }),
  // The win burst lengthens the exhaust without a white flash.
  turboBurst: Object.freeze({
    rim: 0xdf7d31, body: 0xffc365, hot: 0xffebbb, halo: null, rays: null, tongues: 0xed7b27, tongueCore: 0xffd778,
  }),
  safe: Object.freeze({ rim: 0x1c4fc4, body: 0x3f8cff, hot: 0x9dd8f5, halo: null, rays: null, opacity: 0.45 }),
  safePerfect: Object.freeze({ rim: 0x1c4fc4, body: 0x3f8cff, hot: 0xb6e5f7, halo: null, rays: null, opacity: 0.65 }),
  slowing: Object.freeze({ rim: 0x434b56, body: 0x566779, hot: 0x7398a5, halo: null, rays: null, opacity: 0.85 }),
  off: Object.freeze({ rim: 0x1d2026, body: 0x2a2f37, hot: 0x3a4049, halo: null, rays: null }),
});

export const KART_THRUSTER_CONFIG = Object.freeze({
  // The opaque core covers most of the painted cyan glow; the halo softens its edge.
  coreCover: 0.92,
  fadeInMs: 250,
  fadeOutMs: 400,
  rayPoints: 8,
  flicker: Object.freeze({
    periodsMs: Object.freeze([210, 137]),
    depths: Object.freeze([0.045, 0.025]),
    spinPerMs: 0.0021,
  }),
  breathe: Object.freeze({ periodMs: 1600, depth: 0.12 }),
  oneShots: Object.freeze({
    [STUDENT_RACE_EFFECT.TURBO_SUCCESS]: Object.freeze({
      // The flames grow; the glow grows less, so it never washes over the kart.
      durationMs: 1100, envelope: "flare", palette: KART_THRUSTER_PALETTES.turboBurst, peakScale: 1.55, haloPeakScale: 1,
    }),
    [STUDENT_RACE_EFFECT.TURBO_FAILURE]: Object.freeze({
      durationMs: 900, envelope: "sputter", palette: KART_THRUSTER_PALETTES.off,
    }),
    [STUDENT_RACE_EFFECT.SAFE_COMPLETE]: Object.freeze({
      durationMs: 550, envelope: "settle", palette: KART_THRUSTER_PALETTES.safe, peakScale: 1.04,
    }),
    // A small blue acknowledgement stays inside the nozzle housing.
    [STUDENT_RACE_EFFECT.SAFE_PERFECT]: Object.freeze({
      durationMs: 800, envelope: "settle", palette: KART_THRUSTER_PALETTES.safePerfect, peakScale: 1.12,
    }),
  }),
});
