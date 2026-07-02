/*
 * Tailwind class groups for PublicEntryShell — the shared outer shell for
 * public / auth entry screens (landing now; teacher login / register / forgot
 * password later). Built to render ONCE; only the routed <Outlet/> content
 * changes between screens.
 *
 * FULL-BLEED product-landing geometry (not a small centered frame):
 *   phone/tablet: a full-width hero banner reaching the TOP edge, with the white
 *                 sheet rising over it and FILLING DOWN to the bottom edge (no
 *                 bare backdrop below). Content inside the sheet is width-capped.
 *   desktop 1200+: the hero is a full-HEIGHT half that BLEEDS to the outer (end)
 *                  edge — left in RTL, right in LTR — top to bottom; the floating
 *                  card sits on the start side and overlaps the hero's curved edge.
 *
 * Token-only colors (var(--qw-*)) and logical utilities (start/end, ps-/pe-,
 * rounded-s, ltr:/rtl:) so the whole composition mirrors with the <html> dir.
 */

export const PUBLIC_ENTRY_SHELL_STYLES = Object.freeze({
  // Page chrome — token bg, full viewport, own stacking ctx. NO outer padding:
  // the hero must bleed to the viewport edges. Inner elements own their spacing.
  page: "relative isolate min-h-dvh w-full overflow-x-clip bg-[var(--qw-bg)] text-[var(--qw-text)]",

  // Ambient decor (behind everything) — soft color blobs for depth.
  decorLayer: "pointer-events-none absolute inset-0 z-0 overflow-hidden",
  decorBlobPrimary:
    "absolute -top-24 -start-16 h-72 w-72 rounded-full bg-[var(--qw-green)] opacity-[0.10] blur-3xl",
  decorBlobSecondary:
    "absolute -bottom-28 -end-20 h-80 w-80 rounded-full bg-[var(--qw-sky)] opacity-[0.10] blur-3xl",

  // Card foliage (phone/tablet) — soft leaves grounded along the BOTTOM, rendered
  // INSIDE the card (overflow-hidden), clipped to the card so they never touch the
  // hero. Hidden on desktop, where the shell layer below takes over.
  cardLeafLayer: "pointer-events-none absolute inset-0 min-[75rem]:hidden",

  // Shell foliage (desktop only) — leaves hugging the viewport edges around the
  // floating card, filling the dead space. Sits BEHIND the stage (z-5), so the
  // card and the opaque hero mask it: leaves show only in the empty backdrop and
  // never touch the jungle art. pointer-events-none; overflow-hidden keeps them in.
  shellLeafLayer:
    "pointer-events-none absolute inset-0 z-[5] hidden overflow-hidden min-[75rem]:block",

  // Settings overlay — absolute chip in the top-START corner (top-right in RTL /
  // top-left in LTR), matching the reference. Safe-area aware for a phone notch.
  settingsOverlay: "absolute top-[max(1rem,env(safe-area-inset-top))] start-4 z-30",

  // Stage — full width, no max-width cap and no centering, so the frame fills
  // the viewport and the hero can bleed to the edge.
  stage: "relative z-10 w-full",

  // Frame — layout ONLY (no border/bg/shadow). Fills the viewport height so the
  // sheet can reach the bottom on phone/tablet and the hero can be full-height
  // on desktop.
  //   phone/tablet: column — full-width hero on top, sheet fills the rest.
  //   desktop 1200+: row; hero is absolute on the end side, card is the single
  //                  flow child, vertically centered.
  frame:
    "relative flex min-h-dvh w-full flex-col min-[75rem]:flex-row min-[75rem]:items-center",

  // Hero side — full-width top banner reaching the top edge on phone/tablet;
  // a full-height half bleeding to the outer (end) edge on desktop, curved edge.
  heroSide:
    "relative z-0 h-[clamp(16rem,46dvh,26rem)] w-full shrink-0 overflow-hidden min-[75rem]:absolute min-[75rem]:inset-y-0 min-[75rem]:end-0 min-[75rem]:h-full min-[75rem]:w-[58%] min-[75rem]:rounded-s-[3rem]",
  // Hero image fills its side. object-[30%_55%] keeps the monkey+kart (lower-
  // left third of the art) in frame under object-cover at every size; it stays
  // aligned after the LTR -scale-x mirror since object-position is pre-transform.
  heroImage: "absolute inset-0 h-full w-full object-cover object-[30%_55%] ltr:-scale-x-100",

  // Content side — holds the card (start side; mirrors with dir). Phone/tablet:
  // grows (flex-1) so the card fills the screen. Desktop: the panel region;
  // the card inside is capped + pushed toward the hero (see floatingCard).
  contentSide:
    "relative z-10 flex w-full flex-1 flex-col min-[75rem]:w-[50%] min-[75rem]:flex-none",

  // The card — OPAQUE on every screen (no jungle showing through it).
  //   phone/tablet: full-width sheet that rises over the hero (-mt) and FILLS the
  //                 screen (flex-1).
  //   desktop: a compact floating panel (max-w) pulled toward the hero (self-end)
  //            so it overlaps the hero curve and the open space sits on the outer
  //            side — instead of stretching edge to edge.
  // BASE card — only its inner <Outlet/> changes between screens.
  floatingCard:
    "relative -mt-10 w-full flex-1 overflow-hidden rounded-t-[2.5rem] bg-[var(--qw-surface)] p-6 pt-9 text-center shadow-[var(--qw-shadow-card)] sm:p-7 sm:pt-10 min-[75rem]:mt-0 min-[75rem]:w-[36rem] min-[75rem]:flex-none min-[75rem]:self-end min-[75rem]:rounded-[var(--qw-radius-2xl)] min-[75rem]:border min-[75rem]:border-[var(--qw-border)] min-[75rem]:p-9",
  // Card content — width-capped and centered on tablet so a full-width sheet
  // stays readable; fills the panel on desktop.
  cardInner:
    "flex w-full flex-col gap-6 md:max-w-2xl md:mx-auto min-[75rem]:max-w-none min-[75rem]:mx-0 min-[75rem]:gap-8",
  brand: "flex w-full flex-col items-center",
  outletHost: "flex w-full flex-col gap-6",
});
