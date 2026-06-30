/*
 * Tailwind class groups for the public Landing page, hero, and role cards.
 *
 * Colors / radii / shadows come from C-03 tokens via arbitrary values. No raw
 * hex, no component-level CSS classes, no image assets. Direction-neutral
 * utilities (text-start, ms-/me-, start/end, rtl:) so it flips RTL/LTR with the
 * <html> dir attribute.
 */

export const PUBLIC_LANDING_STYLES = Object.freeze({
  // Hero + welcome card composition.
  //   mobile: single column, hero banner on top, card below.
  //   lg:     two columns; card takes the start side, hero the end side.
  grid: "flex w-full flex-col items-stretch gap-6 lg:grid lg:grid-cols-2 lg:items-center lg:gap-10",
  heroCell: "lg:order-2",
  cardCell: "flex w-full justify-center lg:order-1",

  // Welcome card inner layout (the card surface itself is PublicEntryCard).
  cardHeader: "flex w-full flex-col items-center gap-3 text-center",
  welcomeTitle:
    "text-xl font-extrabold leading-tight text-[var(--qw-text)] sm:text-2xl",
  rolePrompt:
    "text-sm font-bold text-[var(--qw-text-muted)] text-center",

  roleSection: "mt-5 flex w-full flex-col gap-3",
  // Stacked rows on mobile, two columns once there's room.
  roleGroup: "grid grid-cols-1 gap-3 sm:grid-cols-2",

  // Responsive hero: compact banner on mobile, tall panel on desktop. Pure
  // token decoration — reserves the spot for the future jungle/monkey/kart art.
  hero: "relative flex h-36 w-full items-center justify-center overflow-hidden rounded-[var(--qw-radius-2xl)] border border-[var(--qw-border)] bg-[var(--qw-surface-alt)] sm:h-44 lg:h-auto lg:min-h-[24rem]",
  heroBackdrop:
    "pointer-events-none absolute inset-0 bg-gradient-to-br from-[var(--qw-surface-alt)] to-[var(--qw-surface)]",
  heroBlobPrimary:
    "pointer-events-none absolute -top-8 -start-6 h-40 w-40 rounded-full bg-[var(--qw-green)] opacity-20 blur-3xl",
  heroBlobAccent:
    "pointer-events-none absolute -bottom-10 -end-6 h-44 w-44 rounded-full bg-[var(--qw-sky)] opacity-20 blur-3xl",
  heroCluster: "relative flex items-end gap-3 sm:gap-4",
  heroBadge:
    "flex h-12 w-12 items-center justify-center rounded-[var(--qw-radius-xl)] bg-[var(--qw-surface)] shadow-[var(--qw-shadow-card)] sm:h-16 sm:w-16",
  heroBadgeRaised: "-translate-y-3 sm:-translate-y-6",
  heroIconGreen: "h-6 w-6 text-[var(--qw-primary)] sm:h-8 sm:w-8",
  heroIconGold: "h-6 w-6 text-[var(--qw-gold)] sm:h-8 sm:w-8",
  heroIconSky: "h-6 w-6 text-[var(--qw-secondary)] sm:h-8 sm:w-8",
});

/*
 * LandingRoleCard — structural classes (tone-independent).
 *
 *   mobile/default: compact row  (media → text → arrow/status).
 *   sm+:            larger card  (media on top, centered text, arrow below).
 *
 * Border WIDTH lives here; border COLOR comes from the tone map so there is no
 * same-property class collision.
 */
export const LANDING_ROLE_CARD_STYLES = Object.freeze({
  card: "group flex min-h-11 w-full items-center gap-3 rounded-[var(--qw-radius-xl)] border bg-[var(--qw-surface)] p-4 text-start transition duration-[var(--qw-duration-base)] outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--qw-surface)] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100 sm:flex-col sm:items-center sm:gap-4 sm:p-5 sm:text-center",
  mediaCircle:
    "flex h-14 w-14 shrink-0 items-center justify-center rounded-full ring-1 sm:h-20 sm:w-20",
  mediaIcon: "h-7 w-7 sm:h-9 sm:w-9",
  body: "flex min-w-0 flex-1 flex-col gap-0.5 sm:flex-none sm:items-center",
  title: "text-base font-extrabold leading-tight text-[var(--qw-text)] sm:text-lg",
  description: "text-sm leading-snug text-[var(--qw-text-muted)]",
  arrow:
    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full ms-auto sm:ms-0",
  arrowIcon: "h-5 w-5 rtl:rotate-180",
  comingSoon:
    "ms-auto shrink-0 rounded-[var(--qw-radius-pill)] bg-[var(--qw-surface-alt)] px-3 py-1 text-xs font-bold text-[var(--qw-text-muted)] sm:ms-0",
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
