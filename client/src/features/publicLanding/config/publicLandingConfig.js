/*
 * Config for the public Landing page. No Tailwind classes (those live in
 * styles/) and no translatable text (that resolves via i18n at render time).
 */

import { GraduationCap, Smile } from "lucide-react";
import { ROUTES } from "../../../constants/routeConstants";
import studentMedia from "../../../assets/landing/landing-role-student-monkey.png";
import teacherMedia from "../../../assets/landing/landing-role-teacher-cap.png";

/*
 * Role options shown on the landing card.
 *  - i18nKey:      node under the publicEntry `role.<i18nKey>.*` translations.
 *  - tone:         "student" | "teacher" → maps to LandingRoleCard tone styles.
 *  - media:        decorative image filling the circular media area.
 *  - FallbackIcon: lucide component used if the image is missing (decorative).
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
    media: studentMedia,
    FallbackIcon: Smile,
    to: null,
    disabled: true,
  },
  {
    id: "teacher",
    i18nKey: "teacher",
    tone: "teacher",
    media: teacherMedia,
    FallbackIcon: GraduationCap,
    to: ROUTES.TEACHER_LOGIN,
    disabled: false,
  },
]);
