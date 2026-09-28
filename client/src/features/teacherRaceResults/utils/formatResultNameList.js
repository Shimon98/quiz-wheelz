export function formatResultNameList(names, language) {
  return new Intl.ListFormat(language, { style: "long", type: "conjunction" }).format(names);
}

export function compactResultNameList(names, language, visibleLimit) {
  if (names.length <= visibleLimit) {
    return { visibleLabel: formatResultNameList(names, language), hiddenCount: 0 };
  }

  return {
    visibleLabel: new Intl.ListFormat(language, { style: "short", type: "unit" }).format(names.slice(0, visibleLimit)),
    hiddenCount: names.length - visibleLimit,
  };
}
