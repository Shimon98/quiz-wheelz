import { SUPPORTED_LANGUAGES } from "../constants/messageConstants";

export function getLanguageDirection(language) {
    return language === SUPPORTED_LANGUAGES.HEBREW ? "rtl" : "ltr";
}

export function isRtlLanguage(language) {
    return getLanguageDirection(language) === "rtl";
}