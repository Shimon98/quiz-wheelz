/*
 * i18n constants for QuizWheelz.
 *
 * Language codes are NOT redefined here — they are re-exported from the
 * existing single source of truth (constants/messageConstants.js) so the app
 * never has two competing language-code lists.
 */

import {
  SUPPORTED_LANGUAGES,
  DEFAULT_LANGUAGE,
} from "../constants/messageConstants";

export { SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE };

export const I18N_NAMESPACES = Object.freeze({
  PUBLIC_SETTINGS: "publicSettings",
  PUBLIC_ENTRY: "publicEntry",
  TEACHER_AUTH: "teacherAuth",
  TEACHER_WORKSPACE: "teacherWorkspace",
  ERRORS: "errors",
});

export const I18N_NAMESPACE_LIST = Object.freeze(
  Object.values(I18N_NAMESPACES),
);

export const DEFAULT_NAMESPACE = I18N_NAMESPACES.PUBLIC_SETTINGS;

// App default is Hebrew; fall back to it so a missing key never renders blank.
export const FALLBACK_LANGUAGE = DEFAULT_LANGUAGE;
