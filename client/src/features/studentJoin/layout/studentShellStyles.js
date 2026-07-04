/*
 * Tailwind class groups for StudentShell — the student-flow shell (join +
 * waiting). Follows the PublicEntryShell PRINCIPLES (render-once chrome,
 * token-only colors via var(--qw-*), logical start/end so the whole
 * composition mirrors with the <html> dir) without copying its full-bleed
 * hero geometry: here the composition is a centered mascot + card pair.
 *
 * Desktop split fires at min-[75rem] = 1200px — the app-wide convention
 * (never Tailwind lg/1024); tablet portrait keeps the phone layout.
 */

export const STUDENT_SHELL_STYLES = Object.freeze({
  // Page chrome — token bg with a soft green→sky wash on top (reads as a pale
  // jungle morning in light mode and a tinted deep navy in dark mode), full
  // viewport, own stacking context. bg color + bg image coexist.
  page: "relative isolate flex min-h-dvh w-full flex-col overflow-x-clip bg-[var(--qw-bg)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--qw-green)_12%,var(--qw-bg)),var(--qw-bg)_42%,color-mix(in_srgb,var(--qw-sky)_10%,var(--qw-bg)))] text-[var(--qw-text)]",

  // Ambient decor (behind everything) — soft color blobs, same recipe as the
  // public entry shell.
  decorLayer: "pointer-events-none absolute inset-0 z-0 overflow-hidden",
  decorBlobPrimary:
    "absolute -top-24 -start-16 h-72 w-72 rounded-full bg-[var(--qw-green)] opacity-[0.10] blur-3xl",
  decorBlobSecondary:
    "absolute -bottom-28 -end-20 h-80 w-80 rounded-full bg-[var(--qw-sky)] opacity-[0.10] blur-3xl",

  // Foliage (PublicEntryLeaves rendered inside; the containers own placement
  // and visibility). Phone/tablet: faint leaves grounded along the page
  // BOTTOM (the "card" leaf set is bottom-grounded). Desktop: stronger leaves
  // hugging the viewport edges — the opaque card masks the middle.
  mobileLeafLayer:
    "pointer-events-none absolute inset-x-0 bottom-0 z-0 h-72 overflow-hidden min-[75rem]:hidden",
  desktopLeafLayer:
    "pointer-events-none absolute inset-0 z-0 hidden overflow-hidden min-[75rem]:block",

  // Settings — chip in the top-START corner (top-right in RTL / top-left in
  // LTR), safe-area aware for a phone notch. Same placement as the public
  // entry shell so the gear lives in one predictable spot app-wide.
  settingsOverlay:
    "absolute top-[max(1rem,env(safe-area-inset-top))] start-4 z-30",

  // Stage — the flow column above the decor layers.
  stage:
    "relative z-10 flex w-full flex-1 flex-col items-center px-4 pb-10 pt-[max(1.25rem,env(safe-area-inset-top))] sm:px-6",

  brandBar: "flex w-full justify-center",

  // Composition — mascot + card. Phone/tablet: centered column (logo → hero →
  // card). Desktop: a row; flex row direction follows dir, so RTL/LTR mirror
  // the WHOLE layout, not just one piece.
  composition:
    "flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 py-4 min-[75rem]:max-w-5xl min-[75rem]:flex-row min-[75rem]:gap-16",

  // Hero — the mascot inside a soft round halo (the same soft-green circle
  // recipe as the landing role card, dark-mode mapped by the token).
  // Decorative only — never layout-critical.
  heroSide:
    "relative flex h-36 w-36 shrink-0 items-center justify-center min-[75rem]:h-[24rem] min-[75rem]:w-[24rem]",
  heroHalo: "absolute inset-0 rounded-full bg-[var(--qw-role-student-soft)]",
  heroImage:
    "relative h-[78%] w-auto drop-shadow-[0_10px_18px_rgba(15,42,67,0.18)]",

  // Card — the ONE opaque content surface, big child-friendly radius. FIXED
  // width on desktop (a w-auto card shrinks to its content per-screen — the
  // same gotcha PublicEntryShell hit).
  card: "w-full rounded-[var(--qw-radius-2xl)] border border-[var(--qw-border)] bg-[var(--qw-surface)] p-5 shadow-[var(--qw-shadow-card)] sm:p-7 min-[75rem]:w-[27rem] min-[75rem]:shrink-0",
});
