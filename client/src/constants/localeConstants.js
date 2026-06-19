import { useLanguageStore } from "../stores/languageStore";
import { DEFAULT_LANGUAGE } from "./messageConstants";

export function useLocaleContent(bilingualContent) {
    const language = useLanguageStore((state) => state.language);
    return bilingualContent[language] ?? bilingualContent[DEFAULT_LANGUAGE];
}