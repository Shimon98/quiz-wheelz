/*
 * Tailwind class groups for the public settings UI.
 *
 * Colors / radii / shadows come from C-03 tokens via arbitrary values. No raw
 * hex, no component-level CSS classes. Direction-neutral utilities only
 * (text-start, ms-/me-, justify-start, ms-auto) so the UI flips RTL/LTR with
 * the <html> dir attribute. Focus uses focus-visible.
 */

export const PUBLIC_SETTINGS_STYLES = Object.freeze({
  // Trigger button — 44px touch target, pill, token focus-visible ring.
  button:
    "inline-flex h-11 w-11 min-h-11 min-w-11 items-center justify-center rounded-[var(--qw-radius-pill)] border border-[var(--qw-border)] bg-[var(--qw-surface)] text-[var(--qw-text)] transition hover:border-[var(--qw-primary)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--qw-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--qw-bg)]",
  buttonIcon: "h-5 w-5",

  // Native <dialog> is the centered card itself; ::backdrop dims via a token.
  // p-0 so the only click region that maps to the dialog element is the
  // backdrop (used for click-to-close); the inner panel owns all padding.
  dialog:
    "m-auto w-[calc(100%-2rem)] max-w-md max-h-[85dvh] overflow-y-auto rounded-[var(--qw-radius-xl)] border border-[var(--qw-border)] bg-[var(--qw-surface)] p-0 text-[var(--qw-text)] shadow-[var(--qw-shadow-lg)] [&::backdrop]:bg-[var(--qw-navy-deep)] [&::backdrop]:opacity-60",
  dialogPanel: "flex flex-col gap-6 p-6",
  dialogHeader: "flex items-center justify-between gap-3",
  dialogTitle: "text-lg font-extrabold text-[var(--qw-text)]",
  closeButton:
    "inline-flex h-11 w-11 min-h-11 min-w-11 items-center justify-center rounded-[var(--qw-radius-pill)] text-[var(--qw-text-muted)] transition hover:bg-[var(--qw-surface-alt)] hover:text-[var(--qw-text)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--qw-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--qw-surface)]",
  closeIcon: "h-5 w-5",

  sections: "flex flex-col gap-6",
  section: "flex flex-col gap-3",
  sectionTitle:
    "text-xs font-bold uppercase tracking-wide text-[var(--qw-text-muted)]",

  // Stacks on mobile, single row on >= sm; each option grows to fill.
  optionGroup: "flex flex-col gap-2 sm:flex-row",
  option:
    "inline-flex min-h-11 items-center justify-start gap-2 rounded-[var(--qw-radius-lg)] border border-[var(--qw-border)] bg-[var(--qw-surface)] px-4 py-2.5 text-sm font-bold text-[var(--qw-text)] transition hover:border-[var(--qw-primary)] sm:flex-1 outline-none focus-visible:ring-2 focus-visible:ring-[var(--qw-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--qw-surface)]",
  optionSelected:
    "border-[var(--qw-primary)] bg-[var(--qw-surface-alt)] text-[var(--qw-primary)]",
  optionIcon: "h-4 w-4 shrink-0",
  optionLabel: "text-start",
  optionCheck: "ms-auto h-4 w-4 shrink-0 text-[var(--qw-primary)]",
});
