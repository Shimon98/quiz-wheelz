import answerSparkle from "../../../../assets/game/studentRace/effects/answer-sparkle.webp";
import burstRing from "../../../../assets/game/studentRace/effects/burst-ring.webp";
import confettiDot from "../../../../assets/game/studentRace/effects/confetti-dot.webp";
import confettiRect from "../../../../assets/game/studentRace/effects/confetti-rect.webp";
import confettiRibbon from "../../../../assets/game/studentRace/effects/confetti-ribbon.webp";
import confettiStar from "../../../../assets/game/studentRace/effects/confetti-star.webp";
import dustPuff1 from "../../../../assets/game/studentRace/effects/dust-puff-1.webp";
import dustPuff2 from "../../../../assets/game/studentRace/effects/dust-puff-2.webp";
import dustPuff3 from "../../../../assets/game/studentRace/effects/dust-puff-3.webp";
import finishGate from "../../../../assets/game/studentRace/effects/finish-gate.webp";
import luckEnergyOrb from "../../../../assets/game/studentRace/effects/luck-energy-orb.webp";
import luckMudDrop from "../../../../assets/game/studentRace/effects/luck-mud-drop.webp";
import luckMudSplash from "../../../../assets/game/studentRace/effects/luck-mud-splash.webp";
import luckShieldImpact from "../../../../assets/game/studentRace/effects/luck-shield-impact.webp";
import luckWindLeaf from "../../../../assets/game/studentRace/effects/luck-wind-leaf.webp";
import luckWindWisp from "../../../../assets/game/studentRace/effects/luck-wind-wisp.webp";
import turboExhaust from "../../../../assets/game/studentRace/effects/turbo-exhaust-painted.webp";
import turboSmokePuff from "../../../../assets/game/studentRace/effects/turbo-smoke-puff.webp";
import wrongGroundImpact from "../../../../assets/game/studentRace/effects/wrong-ground-impact.webp";

// Astra's V4 paintings sit beside the exhaust: each owner keeps its Graphics drawing until its file loads, or if it
// fails. Every file is cut from its master by the private docs/vision/c5_04f_2026-10-28/v4-source script.
export const STUDENT_RACE_EFFECT_ART = Object.freeze({
  turboExhaust: Object.freeze({ url: turboExhaust, anchorX: 0.5, anchorY: 0.08, widthRadii: 2.6, heightRadii: 3.8 }),
  sparkle: Object.freeze({ url: answerSparkle }),
  // A white ring, tinted per burst; its middle line runs at `radius` of its half-width (measured).
  burstRing: Object.freeze({ url: burstRing, radius: 0.883 }),
  groundImpact: Object.freeze({ url: wrongGroundImpact }),
  dustPuff1: Object.freeze({ url: dustPuff1 }),
  dustPuff2: Object.freeze({ url: dustPuff2 }),
  dustPuff3: Object.freeze({ url: dustPuff3 }),
  confettiRect: Object.freeze({ url: confettiRect }),
  confettiRibbon: Object.freeze({ url: confettiRibbon }),
  confettiStar: Object.freeze({ url: confettiStar }),
  confettiDot: Object.freeze({ url: confettiDot }),
  smokePuff: Object.freeze({ url: turboSmokePuff }),
  // anchorX, anchorY is the road between the gate's feet, which stand feetApart of its width apart (measured).
  finishGate: Object.freeze({ url: finishGate, anchorX: 0.499, anchorY: 0.987, feetApart: 0.883 }),
});

// C5-04f Luck art slots. A null url means no approved file yet: the owner keeps its Graphics drawing and loads
// nothing. A slot gets a static import only once its file exists (owners: STUDENT_RACE_SCREEN_AND_ASSETS.md).
export const LUCK_EFFECT_ART = Object.freeze({
  // The painted orb fills `cover` of its square (measured); the drawn stand-in keeps the same size.
  energyOrb: Object.freeze({ url: luckEnergyOrb, cover: 0.844 }),
  // No owner draws a glint file yet: the standing shield paints its own reflection.
  shieldGlint: Object.freeze({ url: null }),
  windLeaf: Object.freeze({ url: luckWindLeaf }),
  // Astra's V3 mud puddle, cropped to its paint; anchorX, anchorY is V3's ground point (0.5, 0.77 of its square) in
  // the cropped file (measured by the private docs/vision/c5_04f_2026-10-28/v3-source script). KartLuckMarks owns it.
  mudSplash: Object.freeze({ url: luckMudSplash, anchorX: 0.492, anchorY: 0.927 }),
  // One painted mud drop, its round head pointing right (+x) and its highlight up, cut from Astra's V2 concept B by
  // the private docs/vision/c5_04f_2026-10-28/mud-source script. Every flying mud blob and drop flies it: the Mud, the
  // blocked hit and the wrong answer's splash.
  mudDrop: Object.freeze({ url: luckMudDrop }),
  // anchorX, anchorY is the flare's white-hot point of contact, which sits on the shield's edge (measured by V3).
  shieldImpact: Object.freeze({ url: luckShieldImpact, anchorX: 0.43, anchorY: 0.52 }),
  // Astra's V4 wisp, upright: KartLuckMarks blows it for each streak of an open Tailwind window.
  windWisp: Object.freeze({ url: luckWindWisp }),
});
