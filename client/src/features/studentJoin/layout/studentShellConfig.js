/*
 * Config for StudentShell — the student flow's identity inside the shared
 * EntryShell (see shared/layouts/entryShell/). Changing a hero, a focal
 * point or a plant = one edit here, never in the shell.
 */

import { ROUTES } from "../../../constants/routeConstants";
import { PLANT_PLACEMENTS } from "../../../shared/components/decor/jungleCornerPlantsConfig";
import joinHero from "../../../assets/student/student-join-hero-wide.webp";
import waitingHero from "../../../assets/student/student-waiting-hero-wide.webp";

export const STUDENT_ENTRY_SHELL_CONFIG = Object.freeze({
  // The student pages carry their own <h1> titles, so the brand title stays
  // a neutral element (on the landing page it IS the h1).
  brandTitleAs: "div",

  // Narrower desktop card than the teacher's — the join form is small.
  cardWidth: "narrow",

  /*
   * Hero art per route; object-position keeps each painting's monkey in
   * frame under object-cover at every crop (mobile banner / desktop tall
   * half). Tuning a focal point = editing the percentage here.
   */
  defaultHero: Object.freeze({
    image: joinHero,
    objectPosition: "60% 55%",
  }),
  heroes: Object.freeze({
    [ROUTES.STUDENT_WAITING]: Object.freeze({
      image: waitingHero,
      objectPosition: "55% 55%",
    }),
  }),

  // Desktop dead-space foliage on the open (start) side — the opaque hero
  // masks the other side, so plants never touch the art.
  shellPlants: Object.freeze({
    placements: Object.freeze([
      PLANT_PLACEMENTS.TOP_START,
      PLANT_PLACEMENTS.BOTTOM_START,
    ]),
    opacity: 0.75,
  }),

  // Faint ground strip inside the phone sheet's floor (landing-card style).
  cardStripOpacity: 0.35,
});
