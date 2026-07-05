/*
 * Tailwind class groups for EntryShell — THE shared entry-screen geometry
 * (public/teacher entry AND the student flow). Lifted 1:1 from the proven
 * PublicEntryShell geometry; the flow-specific knobs (desktop card width,
 * hero focal point) are parametrized, everything else is identical.
 *
 * FULL-BLEED product-landing geometry (not a small centered frame):
 *   phone/tablet: a full-width hero banner reaching the TOP edge, with the
 *                 opaque sheet rising over it and FILLING DOWN to the bottom
 *                 edge. Content inside the sheet is width-capped.
 *   desktop 1200+ (min-[75rem], the app-wide convention — never lg/1024):
 *                 the hero is a full-HEIGHT half bleeding to the outer (end)
 *                 edge; the floating card sits on the start side and overlaps
 *                 the hero's curved edge.
 *
 * Token-only colors (var(--qw-*)) and logical utilities (start/end, rounded-s,
 * ltr:/rtl:) so the whole composition mirrors with the <html> dir.
 */

export const ENTRY_SHELL_STYLES = Object.freeze({
  // Page chrome — token bg, full viewport, own stacking ctx. NO outer padding:
  // the hero must bleed to the viewport edges.
  page: "relative isolate min-h-dvh w-full overflow-x-clip bg-[var(--qw-bg)] text-[var(--qw-text)]",

  // Ambient decor (behind everything) — soft color blobs for depth.
  decorLayer: "pointer-events-none absolute inset-0 z-0 overflow-hidden",
  decorBlobPrimary:
    "absolute -top-24 -start-16 h-72 w-72 rounded-full bg-[var(--qw-green)] opacity-[0.10] blur-3xl",
  decorBlobSecondary:
    "absolute -bottom-28 -end-20 h-80 w-80 rounded-full bg-[var(--qw-sky)] opacity-[0.10] blur-3xl",

  // In-card decor (phone/tablet only) — clipped by the card, never touches
  // the hero. Desktop uses the shell layer below instead.
  cardLeafLayer: "pointer-events-none absolute inset-0 min-[75rem]:hidden",

  // Shell decor (desktop only) — the dead space around the floating card;
  // sits BEHIND the stage, so the card and the opaque hero mask it.
  shellLeafLayer:
    "pointer-events-none absolute inset-0 z-[5] hidden overflow-hidden min-[75rem]:block",

  // Settings — chip in the top-START corner, safe-area aware.
  settingsOverlay:
    "absolute top-[max(1rem,env(safe-area-inset-top))] start-4 z-30",

  // Stage — full width, no max-width cap, so the hero can bleed to the edge.
  stage: "relative z-10 w-full",

  // Frame — layout ONLY. phone/tablet: column (hero on top, sheet fills the
  // rest). desktop: row; hero absolute on the end side, card vertically
  // centered.
  frame:
    "relative flex min-h-dvh w-full flex-col min-[75rem]:flex-row min-[75rem]:items-center",

  // Hero side — full-width top banner on phone/tablet; full-height half
  // bleeding to the outer (end) edge on desktop, curved inner edge.
  heroSide:
    "relative z-0 h-[clamp(16rem,46dvh,26rem)] w-full shrink-0 overflow-hidden min-[75rem]:absolute min-[75rem]:inset-y-0 min-[75rem]:end-0 min-[75rem]:h-full min-[75rem]:w-[58%] min-[75rem]:rounded-s-[3rem]",
  // Hero image fills its side; the focal point (object-position) is per-flow
  // config, applied as inline style — each painting has its own center of
  // interest. Mirrored in LTR so the art keeps facing the card; the focal
  // point survives the flip (object-position is pre-transform).
  heroImage: "absolute inset-0 h-full w-full object-cover ltr:-scale-x-100",

  // Content side — holds the card (start side; mirrors with dir).
  contentSide:
    "relative z-10 flex w-full flex-1 flex-col min-[75rem]:w-[50%] min-[75rem]:flex-none",

  // The card — OPAQUE always. phone/tablet: full-width sheet rising over the
  // hero and filling the screen. desktop: a compact floating panel pulled
  // toward the hero (self-end). Desktop WIDTH is per-flow (see
  // ENTRY_SHELL_CARD_WIDTHS) — always FIXED, never w-auto (a w-auto card
  // shrinks to its content per-screen).
  floatingCard:
    "relative -mt-10 w-full flex-1 overflow-hidden rounded-t-[2.5rem] bg-[var(--qw-surface)] p-6 pt-9 text-center shadow-[var(--qw-shadow-card)] sm:p-7 sm:pt-10 min-[75rem]:mt-0 min-[75rem]:flex-none min-[75rem]:self-end min-[75rem]:rounded-[var(--qw-radius-2xl)] min-[75rem]:border min-[75rem]:border-[var(--qw-border)] min-[75rem]:p-9",

  // Card content — width-capped and centered on tablet; fills on desktop.
  cardInner:
    "flex w-full flex-col gap-6 md:max-w-2xl md:mx-auto min-[75rem]:max-w-none min-[75rem]:mx-0 min-[75rem]:gap-8",
  brand: "flex w-full flex-col items-center",
  outletHost: "flex w-full flex-col gap-6",
});

// Desktop card width per flow — Tailwind classes must be static strings, so
// flows pick a named variant instead of passing a number.
export const ENTRY_SHELL_CARD_WIDTHS = Object.freeze({
  wide: "min-[75rem]:w-[36rem]",
  narrow: "min-[75rem]:w-[30rem]",
});
