import { useEffect, useMemo, useState } from "react";
import { useReducedMotion } from "framer-motion";

const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

/*
 * ShuffleText — a lightweight "shuffle / decode" text effect in the spirit of
 * ReactBits Shuffle, with no GSAP (uses only React + a timer). Characters
 * scramble through random glyphs then settle into place, staggered start→end,
 * and the whole thing replays every `interval` ms ("occasionally moves").
 *
 * `segments` keeps colored parts intact, e.g.
 *   [{ text: "Quiz" }, { text: "Wheelz", className: "text-[var(--qw-primary)]" }]
 *
 * Accessible: the container exposes the real text via aria-label and the
 * animated per-character spans are aria-hidden, so screen readers only ever get
 * the real word, never the scramble. Honors reduced-motion (renders static).
 *
 * The displayed text ALWAYS settles back to the real text (initial render, end
 * of each cycle, reduced-motion, and unmount) — only the brief scramble differs.
 */
export default function ShuffleText({
  segments,
  className = "",
  stagger = 45, // ms between each character settling
  scramble = 520, // ms a character scrambles before it settles
  tick = 55, // ms between glyph swaps while scrambling
  interval = 6500, // ms between replays
}) {
  const reduce = useReducedMotion();

  const chars = useMemo(
    () =>
      segments.flatMap((seg) =>
        [...seg.text].map((ch) => ({ target: ch, className: seg.className || "" }))
      ),
    [segments]
  );
  const fullText = useMemo(() => segments.map((s) => s.text).join(""), [segments]);

  const [display, setDisplay] = useState(() => chars.map((c) => c.target));

  useEffect(() => {
    const settle = () => setDisplay(chars.map((c) => c.target));
    if (reduce) {
      settle();
      return undefined;
    }

    let scrambleTimer;
    let delayTimer;

    const run = () => {
      const start = performance.now();
      scrambleTimer = window.setInterval(() => {
        const elapsed = performance.now() - start;
        let allSettled = true;
        setDisplay(
          chars.map((c, i) => {
            if (elapsed >= i * stagger + scramble) return c.target;
            allSettled = false;
            return c.target === " " ? " " : GLYPHS[(Math.random() * GLYPHS.length) | 0];
          })
        );
        if (allSettled) {
          window.clearInterval(scrambleTimer);
          delayTimer = window.setTimeout(run, interval);
        }
      }, tick);
    };

    delayTimer = window.setTimeout(run, 400);

    return () => {
      window.clearInterval(scrambleTimer);
      window.clearTimeout(delayTimer);
      settle();
    };
  }, [chars, reduce, stagger, scramble, tick, interval]);

  return (
    <span className={className} aria-label={fullText}>
      {chars.map((c, i) => (
        <span key={i} aria-hidden="true" className={c.className}>
          {display[i] === " " ? " " : display[i]}
        </span>
      ))}
    </span>
  );
}
