/*
 * Config for the public Landing page. No Tailwind classes (those live in
 * styles/) and no translatable text (that resolves via i18n at render time).
 */

import { GraduationCap, Smile } from "lucide-react";
import { ROUTES } from "../../../constants/routeConstants";

// Proper noun — identical in every language, so a constant, not an i18n key.
export const BRAND_NAME = "QuizWheelz";

/*
 * Role options shown on the landing card.
 *  - i18nKey:      node under the publicEntry `role.<i18nKey>.*` translations.
 *  - tone:         "student" | "teacher" → maps to LandingRoleCard tone styles.
 *  - FallbackIcon: lucide component shown in the media circle until a real
 *                  image asset is passed (decorative, aria-hidden at render).
 *  - to:           navigation target for an active role.
 *  - disabled:     true => no navigation, shows the "coming soon" label.
 *
 * Student is first (primary audience) but disabled until the join flow (/join)
 * exists; teacher is the only active path for now and routes to login.
 */
export const LANDING_ROLES = Object.freeze([
  {
    id: "student",
    i18nKey: "student",
    tone: "student",
    FallbackIcon: Smile,
    to: null,
    disabled: true,
  },
  {
    id: "teacher",
    i18nKey: "teacher",
    tone: "teacher",
    FallbackIcon: GraduationCap,
    to: ROUTES.LOGIN,
    disabled: false,
  },
]);
