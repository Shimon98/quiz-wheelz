/*
 * Tailwind class groups for PublicEntryShell — the shared outer shell for
 * public / auth entry screens (landing now; teacher login / register / forgot
 * password later). Built to render ONCE; only the routed <Outlet/> content
 * changes between screens.
 *
 * Token-only (bg / text / border / radius / shadow via var(--qw-*)). Logical,
 * direction-neutral utilities (start/end, ms-/me-, ps-/pe-, rounded-s, rtl:/
 * ltr:) so the whole composition mirrors with the <html> dir attribute:
 *   Hebrew (RTL): hero on the left,  card on the right.
 *   English (LTR): hero on the right, card on the left (hero image -scale-x).
 */

// Shared max-width so the settings row, the stage, and the frame stay aligned.
// Wide on desktop so the frame fills the screen instead of floating small.
const STAGE_WIDTH = "max-w-md lg:max-w-6xl xl:max-w-[88rem]";

export const PUBLIC_ENTRY_SHELL_STYLES = Object.freeze({
  // Page chrome — token bg, full viewport, safe-area padding, own stacking ctx.
  page: "relative isolate flex min-h-dvh flex-col overflow-x-clip bg-[var(--qw-bg)] text-[var(--qw-text)] px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-[max(1.25rem,env(safe-area-inset-top))] sm:px-6",

  // Ambient decor + reserved corner slots for future transparent leaf assets
  // (drop an <img> / bg-[url()] into the leaf slots — no structural change).
  decorLayer: "pointer-events-none absolute inset-0 z-0 overflow-hidden",
  decorBlobPrimary:
    "absolute -top-24 -start-16 h-72 w-72 rounded-full bg-[var(--qw-green)] opacity-[0.10] blur-3xl",
  decorBlobSecondary:
    "absolute -bottom-28 -end-20 h-80 w-80 rounded-full bg-[var(--qw-sky)] opacity-[0.10] blur-3xl",
  decorLeafStart: "absolute -bottom-2 -start-2 h-40 w-40", // future leaf asset
  decorLeafEnd: "absolute -bottom-2 -end-2 h-40 w-40", // future leaf asset

  // Settings row above the frame (kept here per preference), frame-aligned.
  topAction: `relative z-10 mx-auto flex min-h-11 w-full items-center ${STAGE_WIDTH}`,

  // Stage centers the FIXED-size frame (it does not fill the whole screen).
  stage: `relative z-10 mx-auto flex w-full flex-1 items-center justify-center py-4 ${STAGE_WIDTH}`,

  // Fixed, rounded outer frame (not full-screen).
  //   mobile: column — hero banner on top, the content card below it.
  //   lg:     hero is an absolute half on the END side (left in RTL / right in
  //           LTR) with a curved inner edge; the content side holds the card,
  //           which floats over that curved edge, vertically centered.
  frame:
    "relative flex w-full flex-col overflow-hidden rounded-[var(--qw-radius-2xl)] border border-[var(--qw-border)] bg-[var(--qw-surface)] shadow-[var(--qw-shadow-lg)] lg:h-[min(82vh,46rem)] lg:flex-row lg:items-center lg:justify-start",

  // Hero side — a flow banner on mobile; an absolute end-side half with a
  // curved (crescent) inner edge on desktop.
  heroSide:
    "relative z-0 h-56 w-full shrink-0 overflow-hidden sm:h-64 lg:absolute lg:inset-y-0 lg:end-0 lg:h-auto lg:w-[58%] lg:rounded-s-[3rem]",
  // Hero image fills its side. Mirrored in English so the monkey keeps facing
  // the card after the sides swap — no separate English asset needed.
  heroImage: "absolute inset-0 h-full w-full object-cover ltr:-scale-x-100",

  // Content side — holds the floating card (start side; mirrors with dir).
  contentSide: "relative z-10 flex w-full flex-col lg:w-[48%] lg:ps-10",

  // The floating card — overlaps the hero banner on mobile and the hero's
  // curved edge on desktop. This is the BASE card; only its inner <Outlet/>
  // content changes per route.
  floatingCard:
    "-mt-6 w-full rounded-[var(--qw-radius-2xl)] bg-[var(--qw-surface)] p-6 text-center shadow-[var(--qw-shadow-card)] sm:p-7 lg:mt-0 lg:border lg:border-[var(--qw-border)] lg:p-9",
  cardInner: "flex w-full flex-col gap-6 lg:gap-8",
  brand: "flex w-full flex-col items-center",
  outletHost: "flex w-full flex-col gap-6",
});
