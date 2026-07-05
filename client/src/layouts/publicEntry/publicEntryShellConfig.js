/*
 * Config for PublicEntryShell — the public/teacher entry flow's identity
 * inside the shared EntryShell (see shared/layouts/entryShell/). The values
 * here reproduce the original PublicEntryShell look exactly.
 */

import { PLANT_PLACEMENTS } from "../../shared/components/decor/jungleCornerPlantsConfig";
import heroImage from "../../assets/landing/landing-hero-jungle-monkey-kart.png";

export const PUBLIC_ENTRY_SHELL_CONFIG = Object.freeze({
  // On the landing page the brand IS the page heading.
  brandTitleAs: "h1",

  // The wide desktop card (36rem) — auth forms and the role picker breathe.
  cardWidth: "wide",

  // One hero for every public/auth screen; 30%/55% keeps the monkey+kart
  // (lower-left third of the art) in frame under object-cover at every size.
  defaultHero: Object.freeze({
    image: heroImage,
    objectPosition: "30% 55%",
  }),

  // Desktop dead-space foliage on the open (start) side, heavily faded —
  // ambience only; the opaque hero masks the other side.
  shellPlants: Object.freeze({
    placements: Object.freeze([
      PLANT_PLACEMENTS.TOP_START,
      PLANT_PLACEMENTS.BOTTOM_START,
    ]),
    opacity: 0.45,
  }),

  // Faint ground strip inside the phone sheet's floor.
  cardStripOpacity: 0.35,
});
