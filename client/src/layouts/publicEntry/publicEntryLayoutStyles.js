/*
 * Tailwind class groups for PublicEntryLayout.
 *
 * All colors / radii / shadows come from C-03 design tokens via arbitrary
 * values (e.g. bg-[var(--qw-bg)]). No component-level CSS classes, no image
 * backgrounds, no raw hex.
 *
 * Stacking model (per approved C-04 corrections — never use negative z-index):
 *   page          -> relative isolate overflow-hidden  (own stacking context)
 *   decorLayer    -> absolute inset-0 z-0 pointer-events-none (behind content)
 *   real content  -> relative z-10 (top action, shell, footer)
 *
 * Direction: the layout never sets `dir`; it inherits RTL/LTR from <html>.
 */

import { PUBLIC_ENTRY_VARIANTS } from "./publicEntryLayoutConfig";

export const PUBLIC_ENTRY_LAYOUT_STYLES = Object.freeze({
  // overflow-x-clip prevents horizontal scroll from the decorative blobs while
  // still allowing vertical scroll on longer screens (register, reset password,
  // student forms). The decorative layer keeps overflow-hidden of its own.
  page:
    "relative isolate flex min-h-dvh flex-col overflow-x-clip bg-[var(--qw-bg)] text-[var(--qw-text)] px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-[max(1.25rem,env(safe-area-inset-top))] sm:px-6",

  // Decorative layer — pure CSS blobs tinted from tokens, low opacity, inert.
  decorLayer: "pointer-events-none absolute inset-0 z-0 overflow-hidden",
  decorBlobPrimary:
    "absolute -top-24 -start-16 h-72 w-72 rounded-full bg-[var(--qw-green)] opacity-[0.12] blur-3xl",
  decorBlobSecondary:
    "absolute -bottom-28 -end-20 h-80 w-80 rounded-full bg-[var(--qw-sky)] opacity-[0.10] blur-3xl",
  decorBlobAccent:
    "absolute start-1/2 top-1/3 h-56 w-56 -translate-x-1/2 rounded-full bg-[var(--qw-banana)] opacity-[0.08] blur-3xl",

  // Top action row (e.g. settings / back). Real content -> z-10.
  topAction:
    "relative z-10 flex min-h-11 w-full items-center justify-between gap-3",

  // Shell wrapper; per-variant placement is merged from PUBLIC_ENTRY_VARIANT_STYLES.
  shellBase:
    "relative z-10 flex w-full flex-1 flex-col items-center justify-center gap-6 py-6",

  // Content column (brand + children) and the inner content host.
  contentColumn: "flex w-full flex-col items-center gap-6",
  contentInner: "w-full",
  brand: "flex w-full flex-col items-center",

  // Visual area base (placement merged per variant).
  visualBase: "w-full",

  // Footer. Real content -> z-10.
  footer:
    "relative z-10 flex w-full flex-col items-center gap-2 pt-6 text-[var(--qw-text-muted)]",
});

/*
 * Per-variant placement.
 *
 * split (desktop two-column): explicit ordering, NOT relying on grid/RTL auto
 * placement. content -> order-1 (right in RTL), visual -> order-2 (left in RTL).
 */
export const PUBLIC_ENTRY_VARIANT_STYLES = Object.freeze({
  [PUBLIC_ENTRY_VARIANTS.STUDENT]: {
    shell: "max-w-md",
    content: "max-w-md",
    visual: "hidden",
  },
  [PUBLIC_ENTRY_VARIANTS.CENTERED]: {
    shell: "max-w-md lg:max-w-lg",
    content: "w-full",
    visual: "w-full max-w-md",
  },
  [PUBLIC_ENTRY_VARIANTS.SPLIT]: {
    shell:
      "max-w-md md:max-w-5xl md:flex-row md:items-stretch md:justify-center md:gap-10",
    content: "w-full md:order-1 md:max-w-md md:self-center",
    visual:
      "hidden md:order-2 md:flex md:flex-1 md:items-center md:justify-center",
  },
  // Wide single column; the screen builds its own hero/content grid inside
  // `children`. No built-in visual slot here (visual stays hidden).
  [PUBLIC_ENTRY_VARIANTS.SHOWCASE]: {
    // mx-auto centers the capped-width stage; without it a flex-column item
    // hugs the cross-start edge (the right in RTL) and looks pushed to the side.
    shell: "mx-auto max-w-md lg:max-w-6xl xl:max-w-7xl",
    content: "w-full",
    visual: "hidden",
  },
});
