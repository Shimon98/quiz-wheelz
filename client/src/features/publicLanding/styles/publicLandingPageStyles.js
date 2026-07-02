/*
 * Residual styles for the landing card content. Mantine components own the
 * structure (Paper/Group/Avatar/Text/Badge); this file keeps only what Mantine
 * props can't express — the jungle tone colors (C-03 CSS tokens, dark-mode
 * aware) and the tiny focus/active polish on the tappable card.
 */

// Tone → C-03 token vars. Student = jungle green, teacher = sky blue.
export const LANDING_ROLE_TONES = Object.freeze({
  student: {
    accent: "var(--qw-primary)",
    accentContrast: "var(--qw-primary-contrast)",
    soft: "var(--qw-role-student-soft)",
  },
  teacher: {
    accent: "var(--qw-secondary)",
    accentContrast: "var(--qw-secondary-contrast)",
    soft: "var(--qw-role-teacher-soft)",
  },
});

export const PUBLIC_LANDING_STYLES = Object.freeze({
  // Focus ring takes the tone color from --qw-tone (set inline per card).
  roleCard:
    "outline-none transition duration-[var(--qw-duration-base)] focus-visible:ring-2 focus-visible:ring-[var(--qw-tone)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--qw-surface)] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100",
  // Chevron points "forward" — flips with direction.
  arrowIcon: "rtl:rotate-180",
});
