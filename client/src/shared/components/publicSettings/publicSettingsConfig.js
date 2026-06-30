/*
 * Options for the public settings selectors. No Tailwind classes here (those
 * live in publicSettingsStyles.js) and no translatable UI text — labels resolve
 * through i18n at render time, except language endonyms (see below).
 */

import { Monitor, Sun, Moon } from "lucide-react";
import { SUPPORTED_LANGUAGES } from "../../../constants/messageConstants";
import { THEME_MODES } from "../../../stores/themeStore";

/*
 * Language options.
 *
 * The label is the ENDONYM — each language shown in its own name — and is an
 * intentional constant, NOT an i18n string: a user who can't read the current
 * UI language must still be able to recognize and pick their own. The section
 * title and aria come from i18n; only these self-names stay fixed.
 */
export const LANGUAGE_OPTIONS = Object.freeze([
  { value: SUPPORTED_LANGUAGES.HEBREW, endonym: "עברית" },
  { value: SUPPORTED_LANGUAGES.ENGLISH, endonym: "English" },
]);

/*
 * Theme mode options. `labelKey` resolves in the publicSettings namespace;
 * `Icon` is a lucide-react component rendered decoratively (aria-hidden).
 */
export const THEME_MODE_OPTIONS = Object.freeze([
  { value: THEME_MODES.SYSTEM, labelKey: "theme.system", Icon: Monitor },
  { value: THEME_MODES.LIGHT, labelKey: "theme.light", Icon: Sun },
  { value: THEME_MODES.DARK, labelKey: "theme.dark", Icon: Moon },
]);
