/*
 * Tailwind class groups for the public-entry BRAND components (C-05). The old
 * card/role primitives were replaced by Mantine (UI-04) and deleted — only the
 * BrandWordmark lockup remains custom (brand visual).
 *
 * Colors come from C-03 design tokens via arbitrary values. Direction:
 * components never set `dir`; they inherit RTL/LTR from <html> and use logical
 * utilities so they flip automatically.
 */

import {
  BRAND_WORDMARK_VARIANTS,
  PUBLIC_ENTRY_COMPONENT_SIZES,
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
    root: "flex-row items-center justify-center gap-3 text-start",
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
    logo: "h-12",
    title: "text-2xl",
    subtitle: "text-sm",
  },
  [PUBLIC_ENTRY_COMPONENT_SIZES.LG]: {
    logo: "h-24",
    title: "text-4xl",
    subtitle: "text-base",
  },
});
