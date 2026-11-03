import luckEnergyOrb from "../../../../assets/game/studentRace/effects/luck-energy-orb.webp";
import luckMudDrop from "../../../../assets/game/studentRace/effects/luck-mud-drop.webp";
import luckMudSplash from "../../../../assets/game/studentRace/effects/luck-mud-splash.webp";
import luckShieldImpact from "../../../../assets/game/studentRace/effects/luck-shield-impact.webp";
import luckWindLeaf from "../../../../assets/game/studentRace/effects/luck-wind-leaf.webp";
import turboExhaust from "../../../../assets/game/studentRace/effects/turbo-exhaust-painted.webp";

export const STUDENT_RACE_EFFECT_ART = Object.freeze({
  turboExhaust: Object.freeze({ url: turboExhaust, anchorX: 0.5, anchorY: 0.08, widthRadii: 2.6, heightRadii: 3.8 }),
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
});
