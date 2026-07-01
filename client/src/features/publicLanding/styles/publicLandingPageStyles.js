/*
 * Tailwind class groups for the landing card CONTENT (rendered into the
 * PublicEntryShell <Outlet/>). The outer shell/frame/hero/brand styles live in
 * layouts/publicEntry/publicEntryShellStyles.js — this file is only the role
 * choice content + the role cards.
 *
 * Colors / radii / shadows come from C-03 tokens via arbitrary values. No raw
 * hex, no component-level CSS classes. Direction-neutral utilities (text-start,
 * ms-/me-, start/end, rtl:) so it flips RTL/LTR with the <html> dir attribute.
 */

export const PUBLIC_LANDING_STYLES = Object.freeze({
  // Heading block: welcome title + role prompt, kept tight together.
  landingHeader: "flex w-full flex-col gap-1.5",
  welcomeTitle:
    "text-xl font-extrabold leading-tight text-[var(--qw-text)] sm:text-2xl lg:text-3xl",
  rolePrompt: "text-sm font-bold text-[var(--qw-text-muted)]",

  // Stacked rows until the frame splits at lg, then two cards side by side.
  roleGroup: "grid grid-cols-1 gap-3 lg:grid-cols-2 lg:gap-4",

  // Decorative role image filling the circular media area.
  roleMedia: "h-full w-full object-cover",
});

/*
 * LandingRoleCard — structural classes (tone-independent).
 *
 *   default (mobile + tablet): compact row  (media → text → arrow/status).
 *   lg:                        larger card  (media on top, centered, arrow below)
 *                              — matching the two side-by-side vision cards.
 *
 * Border WIDTH lives here; border COLOR comes from the tone map so there is no
 * same-property class collision.
 */
export const LANDING_ROLE_CARD_STYLES = Object.freeze({
  card: "group flex min-h-11 w-full items-center gap-3 rounded-[var(--qw-radius-xl)] border bg-[var(--qw-surface)] p-4 text-start transition duration-[var(--qw-duration-base)] outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--qw-surface)] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100 lg:flex-col lg:items-center lg:gap-5 lg:p-8 lg:text-center",
  mediaCircle:
    "flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full ring-1 lg:h-28 lg:w-28",
  mediaIcon: "h-7 w-7 lg:h-14 lg:w-14",
  body: "flex min-w-0 flex-1 flex-col gap-0.5 lg:flex-none lg:items-center",
  title: "text-base font-extrabold leading-tight text-[var(--qw-text)] lg:text-xl",
  description: "text-sm leading-snug text-[var(--qw-text-muted)]",
  arrow:
    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full ms-auto lg:ms-0",
  arrowIcon: "h-5 w-5 rtl:rotate-180",
  comingSoon:
    "ms-auto shrink-0 rounded-[var(--qw-radius-pill)] bg-[var(--qw-surface-alt)] px-3 py-1 text-xs font-bold text-[var(--qw-text-muted)] lg:ms-0",
});

/* Tone styles — token-only. Student = green, teacher = blue. */
export const LANDING_ROLE_TONE_STYLES = Object.freeze({
  student: {
    card: "border-[var(--qw-primary)] hover:border-[var(--qw-primary)] focus-visible:ring-[var(--qw-primary)]",
    circle: "bg-[var(--qw-role-student-soft)] ring-[var(--qw-primary)]",
    icon: "text-[var(--qw-primary)]",
    arrow: "bg-[var(--qw-primary)] text-[var(--qw-primary-contrast)]",
  },
  teacher: {
    card: "border-[var(--qw-secondary)] hover:border-[var(--qw-secondary)] focus-visible:ring-[var(--qw-secondary)]",
    circle: "bg-[var(--qw-role-teacher-soft)] ring-[var(--qw-secondary)]",
    icon: "text-[var(--qw-secondary)]",
    arrow: "bg-[var(--qw-secondary)] text-[var(--qw-secondary-contrast)]",
  },
});
