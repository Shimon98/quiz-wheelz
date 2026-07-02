/*
 * Assembles locale modules into the i18next `resources` object, keyed by
 * language code then namespace. Adding a namespace = add its files here.
 */

import { SUPPORTED_LANGUAGES, I18N_NAMESPACES } from "./i18nConstants";

import hePublicSettings from "./locales/he/publicSettings";
import hePublicEntry from "./locales/he/publicEntry";
import heTeacherAuth from "./locales/he/teacherAuth";
import heTeacherWorkspace from "./locales/he/teacherWorkspace";
import enPublicSettings from "./locales/en/publicSettings";
import enPublicEntry from "./locales/en/publicEntry";
import enTeacherAuth from "./locales/en/teacherAuth";
import enTeacherWorkspace from "./locales/en/teacherWorkspace";

export const i18nResources = {
  [SUPPORTED_LANGUAGES.HEBREW]: {
    [I18N_NAMESPACES.PUBLIC_SETTINGS]: hePublicSettings,
    [I18N_NAMESPACES.PUBLIC_ENTRY]: hePublicEntry,
    [I18N_NAMESPACES.TEACHER_AUTH]: heTeacherAuth,
    [I18N_NAMESPACES.TEACHER_WORKSPACE]: heTeacherWorkspace,
  },
  [SUPPORTED_LANGUAGES.ENGLISH]: {
    [I18N_NAMESPACES.PUBLIC_SETTINGS]: enPublicSettings,
    [I18N_NAMESPACES.PUBLIC_ENTRY]: enPublicEntry,
    [I18N_NAMESPACES.TEACHER_AUTH]: enTeacherAuth,
    [I18N_NAMESPACES.TEACHER_WORKSPACE]: enTeacherWorkspace,
  },
};
