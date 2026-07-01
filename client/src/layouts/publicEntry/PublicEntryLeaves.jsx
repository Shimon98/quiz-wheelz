import { motion, useReducedMotion } from "framer-motion";

/*
 * PublicEntryLeaves — soft jungle foliage for the PublicEntryShell. Two variants:
 *   "card"  (phone/tablet): faint leaves grounded along the BOTTOM inside the
 *           card, clipped to the card so they never touch the hero art.
 *   "shell" (desktop): stronger leaves hugging the VIEWPORT edges around the
 *           floating card — as if growing in from the edges — filling the dead
 *           space. Rendered in a layer behind the card + hero, so the opaque hero
 *           masks the ones on its side; they never touch the jungle art.
 *
 * Positions use logical start/end so the foliage mirrors with the <html> dir.
 * Honors prefers-reduced-motion (static then). Asset-swap ready: to use painted
 * leaf PNGs later, keep the positions and render <img> instead of <svg>.
 */

const SHAPES = {
  broad: "M50 6 C18 28 14 76 50 116 C86 76 82 28 50 6 Z",
  slim: "M50 4 C39 30 37 92 50 118 C63 92 61 30 50 4 Z",
};
const VEIN = "M50 16 L50 106";

// Inside the card (phone/tablet): faint, grounded along the bottom.
const CARD_LEAVES = [
  { pos: "-bottom-12 -start-6", size: "h-64 w-64", shape: "broad", rot: 16, op: 0.18, dur: 12, delay: 0 },
  { pos: "-bottom-8 start-[22%]", size: "h-48 w-48", shape: "slim", rot: -10, op: 0.14, dur: 10, delay: 0.7 },
  { pos: "-bottom-14 start-[45%]", size: "h-56 w-56", shape: "broad", rot: 8, op: 0.13, dur: 13, delay: 1.2 },
  { pos: "-bottom-10 end-[20%]", size: "h-52 w-52", shape: "slim", rot: 22, op: 0.14, dur: 11, delay: 0.4 },
  { pos: "-bottom-12 -end-6", size: "h-64 w-64", shape: "broad", rot: -16, op: 0.18, dur: 12, delay: 0.9 },
  { pos: "bottom-1/4 -start-10", size: "h-44 w-44", shape: "slim", rot: -22, op: 0.12, dur: 13, delay: 1.5 },
  { pos: "bottom-1/3 -end-10", size: "h-40 w-40", shape: "broad", rot: 20, op: 0.11, dur: 11, delay: 0.6 },
];

// Shell backdrop (desktop): hug the viewport edges around the card, growing in.
const SHELL_LEAVES = [
  // start edge (right in RTL), top → bottom
  { pos: "-top-8 -start-6", size: "h-52 w-52", shape: "broad", rot: -22, op: 0.44, dur: 12, delay: 0 },
  { pos: "top-1/4 -start-14", size: "h-56 w-56", shape: "slim", rot: 16, op: 0.4, dur: 13, delay: 0.6 },
  { pos: "top-1/2 -start-12", size: "h-48 w-48", shape: "broad", rot: -14, op: 0.38, dur: 11, delay: 1.1 },
  { pos: "-bottom-10 -start-8", size: "h-64 w-64", shape: "broad", rot: 14, op: 0.46, dur: 12, delay: 0.3 },
  // bottom edge — growing up
  { pos: "-bottom-16 start-[14%]", size: "h-60 w-60", shape: "slim", rot: -10, op: 0.4, dur: 14, delay: 0.9 },
  { pos: "-bottom-12 start-[28%]", size: "h-56 w-56", shape: "broad", rot: 22, op: 0.36, dur: 11, delay: 1.4 },
  // top edge peek
  { pos: "-top-10 start-[20%]", size: "h-44 w-44", shape: "slim", rot: 24, op: 0.34, dur: 13, delay: 0.4 },
];

export default function PublicEntryLeaves({ variant = "card" }) {
  const reduce = useReducedMotion();
  const leaves = variant === "shell" ? SHELL_LEAVES : CARD_LEAVES;

  return leaves.map((leaf, i) => (
    <motion.svg
      key={i}
      viewBox="0 0 100 120"
      aria-hidden="true"
      className={`absolute ${leaf.pos} ${leaf.size} text-[var(--qw-green)] blur-[1.5px]`}
      style={reduce ? { rotate: leaf.rot, opacity: leaf.op } : { opacity: leaf.op }}
      animate={
        reduce
          ? undefined
          : { rotate: [leaf.rot, leaf.rot + 4, leaf.rot - 3, leaf.rot], y: [0, -7, 4, 0] }
      }
      transition={
        reduce
          ? undefined
          : { duration: leaf.dur, delay: leaf.delay, repeat: Infinity, ease: "easeInOut" }
      }
    >
      <path d={SHAPES[leaf.shape]} fill="currentColor" />
      <path d={VEIN} stroke="var(--qw-surface)" strokeWidth="2.5" opacity="0.5" fill="none" />
    </motion.svg>
  ));
}
