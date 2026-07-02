import { motion, useReducedMotion } from "framer-motion";
import { cx } from "../../../utils/classNameUtils";
import ShuffleText from "../publicEntry/ShuffleText";
import bananaMark from "../../../assets/brand/quizwheelz-mark.png";

/**
 * BrandLockup — THE QuizWheelz brand lockup, used by the public entry shell
 * AND the teacher workspace (one component, one look): the banana mark just
 * before the "Q" + the ShuffleText title that occasionally re-scrambles.
 * Easter egg: hovering the banana tips it over, then it springs back.
 *
 * Font-size is INHERITED — the banana is sized in em (h-[1.1em]) so the whole
 * lockup scales with whatever typography the caller wraps it in (the landing
 * h1, a navbar heading...). Pass `className` to set size/weight directly.
 *
 * dir="ltr" keeps the Latin lockup left-to-right (banana → QuizWheelz) in
 * both languages; the aria-label carries the real word for screen readers.
 */
export default function BrandLockup({ className = "" }) {
  const reduce = useReducedMotion();

  return (
    <span
      dir="ltr"
      className={cx("inline-flex items-center whitespace-nowrap", className)}
      aria-label="QuizWheelz"
    >
      <motion.img
        src={bananaMark}
        alt=""
        aria-hidden="true"
        draggable="false"
        className="me-1 inline-block h-[1.1em] w-auto shrink-0"
        whileHover={reduce ? undefined : { rotate: -24, scale: 1.15 }}
        transition={{ type: "spring", stiffness: 300, damping: 12 }}
      />
      <ShuffleText
        segments={[
          { text: "Quiz" },
          { text: "Wheelz", className: "text-[var(--qw-primary)]" },
        ]}
      />
    </span>
  );
}
