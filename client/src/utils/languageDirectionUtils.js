import { SUPPORTED_LANGUAGES } from "../i18n/i18nConstants";

export function getLanguageDirection(language) {
    return language === SUPPORTED_LANGUAGES.HEBREW ? "rtl" : "ltr";
}

export function isRtlLanguage(language) {
    return getLanguageDirection(language) === "rtl";
}