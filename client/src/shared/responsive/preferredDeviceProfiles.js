export const PREFERRED_DEVICE_PROFILES = Object.freeze({
  TEACHER_LIVE: Object.freeze({
    id: "teacher-live",
    minWidth: 1024,
    minHeight: 600,
    requireLandscape: true,
  }),
  STUDENT_RACE: Object.freeze({
    id: "student-race",
    maxShortSide: 600,
    maxLongSide: 1000,
  }),
});

export function isViewportPreferred(profile, { width, height }) {
  if (profile.requireLandscape && width < height) {
    return false;
  }

  if (profile.minWidth != null && width < profile.minWidth) {
    return false;
  }

  if (profile.minHeight != null && height < profile.minHeight) {
    return false;
  }

  const shortSide = Math.min(width, height);
  const longSide = Math.max(width, height);

  if (profile.maxShortSide != null && shortSide > profile.maxShortSide) {
    return false;
  }

  if (profile.maxLongSide != null && longSide > profile.maxLongSide) {
    return false;
  }

  return true;
}
