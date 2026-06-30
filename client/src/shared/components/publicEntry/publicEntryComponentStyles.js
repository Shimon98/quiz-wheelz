/*
 * Tailwind class groups for the public-entry component set (C-05).
 *
 * All colors / radii / shadows come from C-03 design tokens via arbitrary
 * values (e.g. bg-[var(--qw-surface)]). No raw hex, no component-level CSS
 * classes, no image backgrounds.
 *
 * Direction: components never set `dir`; they inherit RTL/LTR from <html> and
 * use logical utilities (text-start, ms-/me-, ps-/pe-) so they flip
 * automatically. Focus uses focus-visible only.
 */

import {
  BRAND_WORDMARK_VARIANTS,
  PUBLIC_ENTRY_COMPONENT_SIZES,
  PUBLIC_ENTRY_CARD_VARIANTS,
} from "./publicEntryComponentConfig";

/* ── BrandWordmark ──────────────────────────────────────────────────── */

export const BRAND_WORDMARK_STYLES = Object.freeze({
  root: "flex w-full",
  logo: "w-auto object-contain",
  textGroup: "flex flex-col",
  title: "font-extrabold leading-tight tracking-tight text-[var(--qw-text)]",
  subtitle: "font-medium leading-snug text-[var(--qw-text-muted)]",
});

export const BRAND_WORDMARK_VARIANT_STYLES = Object.freeze({
  // Logo above text, everything centered.
  [BRAND_WORDMARK_VARIANTS.STACKED]: {
    root: "flex-col items-center gap-3 text-center",
    textGroup: "items-center text-center",
  },
  // Logo beside text, aligned to the reading start edge.
  [BRAND_WORDMARK_VARIANTS.INLINE]: {
    root: "flex-row items-center gap-3 text-start",
    textGroup: "items-start text-start",
  },
});

export const BRAND_WORDMARK_SIZE_STYLES = Object.freeze({
  [PUBLIC_ENTRY_COMPONENT_SIZES.SM]: {
    logo: "h-10",
    title: "text-lg",
    subtitle: "text-xs",
  },
  [PUBLIC_ENTRY_COMPONENT_SIZES.MD]: {
    logo: "h-16",
    title: "text-2xl",
    subtitle: "text-sm",
  },
  [PUBLIC_ENTRY_COMPONENT_SIZES.LG]: {
    logo: "h-24",
    title: "text-4xl",
    subtitle: "text-base",
  },
});

/* ── PublicEntryCard ────────────────────────────────────────────────── */

export const PUBLIC_ENTRY_CARD_STYLES = Object.freeze({
  root: "flex w-full flex-col border border-[var(--qw-border)] bg-[var(--qw-surface)] text-[var(--qw-text)] rounded-[var(--qw-radius-xl)] shadow-[var(--qw-shadow-card)]",
  header: "flex flex-col gap-3",
  iconWrap: "flex",
  headingGroup: "flex flex-col gap-1 text-start",
  eyebrow:
    "text-xs font-bold uppercase tracking-wide text-[var(--qw-text-muted)]",
  title: "text-xl font-extrabold leading-tight text-[var(--qw-text)]",
  description: "text-sm leading-relaxed text-[var(--qw-text-muted)]",
  content: "flex flex-col",
  footer: "flex flex-col gap-2",
});

export const PUBLIC_ENTRY_CARD_VARIANT_STYLES = Object.freeze({
  [PUBLIC_ENTRY_CARD_VARIANTS.DEFAULT]: {
    root: "max-w-md gap-5 p-6",
  },
  [PUBLIC_ENTRY_CARD_VARIANTS.COMPACT]: {
    root: "max-w-sm gap-4 p-5",
  },
  [PUBLIC_ENTRY_CARD_VARIANTS.WIDE]: {
    root: "max-w-2xl gap-6 p-8",
  },
});

/* ── RoleSelectCard ─────────────────────────────────────────────────── */

export const ROLE_SELECT_CARD_STYLES = Object.freeze({
  // Real <button>: full-width tappable card, >= 44px target, logical padding,
  // token surface/border, focus-visible ring, explicit disabled visuals.
  root: "group flex min-h-11 w-full flex-col items-start gap-3 text-start border border-[var(--qw-border)] bg-[var(--qw-surface)] text-[var(--qw-text)] rounded-[var(--qw-radius-xl)] shadow-[var(--qw-shadow-card)] p-6 transition duration-[var(--qw-duration-base)] hover:border-[var(--qw-primary)] active:scale-[0.99] outline-none focus-visible:ring-2 focus-visible:ring-[var(--qw-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--qw-bg)] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none disabled:hover:border-[var(--qw-border)] disabled:active:scale-100",
  iconWrap: "flex",
  body: "flex flex-col gap-1",
  title: "text-lg font-extrabold leading-tight text-[var(--qw-text)]",
  description: "text-sm leading-relaxed text-[var(--qw-text-muted)]",
  action:
    "mt-1 inline-flex items-center gap-1 text-sm font-bold text-[var(--qw-primary)]",
});
