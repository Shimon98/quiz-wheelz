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
  TEACHER_LIVE_RACE: "teacherLiveRace",
  STUDENT_JOIN: "studentJoin",
  STUDENT_RACE: "studentRace",
  ERRORS: "errors",
});

export const I18N_NAMESPACE_LIST = Object.freeze(
  Object.values(I18N_NAMESPACES),
);

export const DEFAULT_NAMESPACE = I18N_NAMESPACES.PUBLIC_SETTINGS;

export const FALLBACK_LANGUAGE = DEFAULT_LANGUAGE;
