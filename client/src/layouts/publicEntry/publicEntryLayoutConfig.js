/*
 * Configuration for PublicEntryLayout.
 *
 * Variant keys only — no "landing" variant in this phase.
 * No Tailwind classes here (those live in publicEntryLayoutStyles.js).
 */

export const PUBLIC_ENTRY_VARIANTS = Object.freeze({
  STUDENT: "student",
  // SPLIT = desktop two-column layout shape (content + visual side by side).
  // Not role-specific; named for the shape so any screen can use it.
  SPLIT: "split",
  CENTERED: "centered",
  // SHOWCASE = wide single-column shell for hero + content compositions where
  // the screen lays out its own internal grid (e.g. the landing page). Not
  // role-specific, not landing-only.
  SHOWCASE: "showcase",
});

export const DEFAULT_PUBLIC_ENTRY_VARIANT = PUBLIC_ENTRY_VARIANTS.CENTERED;

export const PUBLIC_ENTRY_VARIANT_VALUES = Object.freeze(
  Object.values(PUBLIC_ENTRY_VARIANTS),
);

/**
 * Returns a known variant, falling back to the default for unknown input.
 * Keeps the component safe without throwing on a bad prop.
 */
export function resolvePublicEntryVariant(variant) {
  return PUBLIC_ENTRY_VARIANT_VALUES.includes(variant)
    ? variant
    : DEFAULT_PUBLIC_ENTRY_VARIANT;
}
