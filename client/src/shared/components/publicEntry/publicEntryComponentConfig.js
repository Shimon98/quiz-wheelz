/*
 * Configuration for the public-entry component set (C-05).
 *
 * Variant / size keys only — no Tailwind classes here (those live in
 * publicEntryComponentStyles.js) and no user-facing text (that arrives
 * through props so the set stays i18n-ready).
 */

export const BRAND_WORDMARK_VARIANTS = Object.freeze({
  STACKED: "stacked",
  INLINE: "inline",
});

export const DEFAULT_BRAND_WORDMARK_VARIANT = BRAND_WORDMARK_VARIANTS.STACKED;

export const PUBLIC_ENTRY_COMPONENT_SIZES = Object.freeze({
  SM: "sm",
  MD: "md",
  LG: "lg",
});

export const DEFAULT_PUBLIC_ENTRY_COMPONENT_SIZE =
  PUBLIC_ENTRY_COMPONENT_SIZES.MD;
