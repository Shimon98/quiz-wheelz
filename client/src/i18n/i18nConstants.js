/*
 * i18n constants for QuizWheelz — the single source of truth for language
 * codes and namespaces. (The legacy constants/messageConstants.js home was
 * retired together with the old hardcoded-text error tables.)
 */

export const SUPPORTED_LANGUAGES = Object.freeze({
  HEBREW: "he",
  ENGLISH: "en",
});

export const DEFAULT_LANGUAGE = SUPPORTED_LANGUAGES.HEBREW;

export const I18N_NAMESPACES = Object.freeze({
  PUBLIC_SETTINGS: "publicSettings",
  PUBLIC_ENTRY: "publicEntry",
  TEACHER_AUTH: "teacherAuth",
  TEACHER_WORKSPACE: "teacherWorkspace",
  STUDENT_JOIN: "studentJoin",
  ERRORS: "errors",
});

export const I18N_NAMESPACE_LIST = Object.freeze(
  Object.values(I18N_NAMESPACES),
);

export const DEFAULT_NAMESPACE = I18N_NAMESPACES.PUBLIC_SETTINGS;

// App default is Hebrew; fall back to it so a missing key never renders blank.
export const FALLBACK_LANGUAGE = DEFAULT_LANGUAGE;
