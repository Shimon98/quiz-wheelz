import { SUPPORTED_LANGUAGES } from "../../../constants/messageConstants";

const HEBREW_SUBJECT_LABELS_BY_CODE = {
    MATH: "חשבון",
    MATHEMATICS: "מתמטיקה",
    SCIENCE: "מדעים",
    ENGLISH: "אנגלית",
    HEBREW: "עברית",
    HISTORY: "היסטוריה",
};

const HEBREW_SUBJECT_LABELS_BY_NAME = {
    math: "חשבון",
    mathematics: "מתמטיקה",
    science: "מדעים",
    english: "אנגלית",
    hebrew: "עברית",
    history: "היסטוריה",
};

export function getSubjectDisplayName(subject, language) {
    const rawName = subject.subjectName ?? subject.name ?? "";
    const rawCode = subject.subjectCode ?? subject.code ?? "";

    if (language !== SUPPORTED_LANGUAGES.HEBREW) {
        return rawName || rawCode;
    }

    const normalizedCode = String(rawCode).trim().toUpperCase();
    const normalizedName = String(rawName).trim().toLowerCase();

    return (
        HEBREW_SUBJECT_LABELS_BY_CODE[normalizedCode] ??
        HEBREW_SUBJECT_LABELS_BY_NAME[normalizedName] ??
        rawName ??
        rawCode
    );
}