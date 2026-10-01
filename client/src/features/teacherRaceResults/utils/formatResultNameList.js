const FULL_LIST = Object.freeze({ style: "long", type: "conjunction" });
const COMPACT_LIST = Object.freeze({ style: "short", type: "unit" });

export const RESULT_NAME_PART = "element";

export function formatResultNameList(names, language) {
  return new Intl.ListFormat(language, FULL_LIST).format(names);
}

export function compactResultNameList(names, language, visibleLimit) {
  if (names.length <= visibleLimit) {
    return { visibleParts: new Intl.ListFormat(language, FULL_LIST).formatToParts(names), hiddenCount: 0 };
  }

  return {
    visibleParts: new Intl.ListFormat(language, COMPACT_LIST).formatToParts(names.slice(0, visibleLimit)),
    hiddenCount: names.length - visibleLimit,
  };
}
