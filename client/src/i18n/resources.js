import { SUPPORTED_LANGUAGES, I18N_NAMESPACES } from "./i18nConstants";

import hePublicSettings from "./locales/he/publicSettings";
import hePublicEntry from "./locales/he/publicEntry";
import heTeacherAuth from "./locales/he/teacherAuth";
import heTeacherWorkspace from "./locales/he/teacherWorkspace";
import heTeacherLiveRace from "./locales/he/teacherLiveRace";
import heStudentJoin from "./locales/he/studentJoin";
import heStudentRace from "./locales/he/studentRace";
import heErrors from "./locales/he/errors";
import enPublicSettings from "./locales/en/publicSettings";
import enPublicEntry from "./locales/en/publicEntry";
import enTeacherAuth from "./locales/en/teacherAuth";
import enTeacherWorkspace from "./locales/en/teacherWorkspace";
import enTeacherLiveRace from "./locales/en/teacherLiveRace";
import enStudentJoin from "./locales/en/studentJoin";
import enStudentRace from "./locales/en/studentRace";
import enErrors from "./locales/en/errors";

export const i18nResources = {
  [SUPPORTED_LANGUAGES.HEBREW]: {
    [I18N_NAMESPACES.PUBLIC_SETTINGS]: hePublicSettings,
    [I18N_NAMESPACES.PUBLIC_ENTRY]: hePublicEntry,
    [I18N_NAMESPACES.TEACHER_AUTH]: heTeacherAuth,
    [I18N_NAMESPACES.TEACHER_WORKSPACE]: heTeacherWorkspace,
    [I18N_NAMESPACES.TEACHER_LIVE_RACE]: heTeacherLiveRace,
    [I18N_NAMESPACES.STUDENT_JOIN]: heStudentJoin,
    [I18N_NAMESPACES.STUDENT_RACE]: heStudentRace,
    [I18N_NAMESPACES.ERRORS]: heErrors,
  },
  [SUPPORTED_LANGUAGES.ENGLISH]: {
    [I18N_NAMESPACES.PUBLIC_SETTINGS]: enPublicSettings,
    [I18N_NAMESPACES.PUBLIC_ENTRY]: enPublicEntry,
    [I18N_NAMESPACES.TEACHER_AUTH]: enTeacherAuth,
    [I18N_NAMESPACES.TEACHER_WORKSPACE]: enTeacherWorkspace,
    [I18N_NAMESPACES.TEACHER_LIVE_RACE]: enTeacherLiveRace,
    [I18N_NAMESPACES.STUDENT_JOIN]: enStudentJoin,
    [I18N_NAMESPACES.STUDENT_RACE]: enStudentRace,
    [I18N_NAMESPACES.ERRORS]: enErrors,
  },
};
