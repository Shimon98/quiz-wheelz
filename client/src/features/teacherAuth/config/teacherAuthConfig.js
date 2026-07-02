/*
 * Config for the teacher auth feature. Named values only — no Tailwind classes
 * and no translatable text (that lives in i18n/locales/{he,en}/teacherAuth.js).
 *
 * Validation constants are CLIENT-SIDE pre-checks for fast feedback; the server
 * remains the source of truth and its errorCode responses map through
 * errors/errorUtils.js regardless of these values.
 */

// Minimum password length enforced in forms (register / reset).
export const PASSWORD_MIN_LENGTH = 6;

// The emailed reset code is 6 digits (docs/vision/teacher-auth-flow.png).
export const RESET_CODE_LENGTH = 6;

// Cooldown before "resend code" becomes available again.
export const RESEND_COOLDOWN_SECONDS = 60;

// Simple pre-check only (server validates properly): something@something.tld
export const EMAIL_PATTERN = /^\S+@\S+\.\S+$/;

// Max width (px) of the auth form column on desktop, so inputs stay a
// comfortable reading width inside the wide shell card instead of stretching
// edge to edge (docs/vision/teacher-auth-flow.png proportions).
export const AUTH_FORM_MAX_WIDTH = 460;

// Steps of the forgot-password flow, in order.
export const FORGOT_PASSWORD_STEPS = Object.freeze({
  REQUEST: "request",
  VERIFY: "verify",
  RESET: "reset",
  DONE: "done",
});
