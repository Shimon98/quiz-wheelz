export function isFullscreenSupported() {
  return typeof document !== "undefined" && document.fullscreenEnabled === true;
}
