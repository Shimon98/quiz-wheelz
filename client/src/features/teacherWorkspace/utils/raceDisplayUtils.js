import { SUPPORTED_LANGUAGES } from "../../../constants/messageConstants";

/*
 * Turns a raw race object from the dashboard API into the display values both
 * race preview layouts (desktop table + mobile cards) render — the single
 * place that knows the server's field names, so the two layouts can never
 * drift apart.
 */

// The server sends subject names/codes in English; Hebrew display names live
// here until the server localizes subjects itself.
const HEBREW_SUBJECT_LABELS = {
  MATH: "חשבון",
  MATHEMATICS: "מתמטיקה",
  SCIENCE: "מדעים",
  ENGLISH: "אנגלית",
  HEBREW: "עברית",
  HISTORY: "היסטוריה",
};

export function getSubjectDisplayName(race, language) {
  const rawName = race?.subjectName ?? race?.subject?.name ?? "";
  const rawCode = race?.subjectCode ?? race?.subject?.code ?? "";

  if (language !== SUPPORTED_LANGUAGES.HEBREW) {
    return rawName || rawCode;
  }

  return (
    HEBREW_SUBJECT_LABELS[String(rawCode).trim().toUpperCase()] ??
    HEBREW_SUBJECT_LABELS[String(rawName).trim().toUpperCase()] ??
    rawName ??
    rawCode
  );
}

export function formatPlayers(race) {
  return `${race?.currentPlayers ?? 0}/${race?.maxPlayers ?? 0}`;
}

export function formatRaceDate(value, language) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const locale =
    language === SUPPORTED_LANGUAGES.HEBREW ? "he-IL" : "en-US";

  return new Intl.DateTimeFormat(locale, {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

// Normalized subject identifier for icon lookup (RaceSubjectLabel).
export function getSubjectKey(race) {
  const raw =
    race?.subjectCode ??
    race?.subject?.code ??
    race?.subjectName ??
    race?.subject?.name ??
    "";

  return String(raw).trim().toUpperCase();
}

export function buildRaceViewModel(race, language) {
  return {
    id: race?.id,
    title: race?.title ?? "",
    roomCode: race?.roomCode ?? null,
    subjectName: getSubjectDisplayName(race, language),
    subjectKey: getSubjectKey(race),
    playersLabel: formatPlayers(race),
    createdAtLabel: formatRaceDate(race?.createdAt, language),
    status: race?.status,
    race,
  };
}
