import { useEffect, useMemo, useState } from "react";
import { useReducedMotion } from "framer-motion";

import { cx } from "../../../utils/classNameUtils";

const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
const DEFAULT_STAGGER_MS = 45;
const DEFAULT_SCRAMBLE_MS = 520;
const DEFAULT_TICK_MS = 55;
const DEFAULT_REPLAY_INTERVAL_MS = 10_000;
const FIRST_RUN_DELAY_MS = 400;

const CHARACTER_CELL = "relative inline-block whitespace-pre";
const CHARACTER_SIZER_HIDDEN = "invisible";
const CHARACTER_GLYPH = "absolute left-1/2 top-0 -translate-x-1/2";

function ShuffleCharacter({ target, glyph, className }) {
  const isScrambling = glyph !== target;

  return (
    <span
      aria-hidden="true"
      data-shuffle-character={target}
      className={cx(CHARACTER_CELL, className)}
    >
      <span className={isScrambling ? CHARACTER_SIZER_HIDDEN : undefined}>
        {target}
      </span>
      {isScrambling ? <span className={CHARACTER_GLYPH}>{glyph}</span> : null}
    </span>
  );
}

export default function ShuffleText({
  segments,
  className = "",
  stagger = DEFAULT_STAGGER_MS,
  scramble = DEFAULT_SCRAMBLE_MS,
  tick = DEFAULT_TICK_MS,
  interval = DEFAULT_REPLAY_INTERVAL_MS,
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

    delayTimer = window.setTimeout(run, FIRST_RUN_DELAY_MS);

    return () => {
      window.clearInterval(scrambleTimer);
      window.clearTimeout(delayTimer);
      settle();
    };
  }, [chars, reduce, stagger, scramble, tick, interval]);

  return (
    <span className={className} aria-label={fullText}>
      {chars.map((c, i) => (
        <ShuffleCharacter
          key={i}
          target={c.target}
          glyph={display[i]}
          className={c.className}
        />
      ))}
    </span>
  );
}
