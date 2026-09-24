import { motion, useReducedMotion } from "framer-motion";
import { cx } from "../../../utils/classNameUtils";
import ShuffleText from "../publicEntry/ShuffleText";
import bananaMark from "../../../assets/brand/quizwheelz-mark.webp";

const BRAND_SEGMENTS = Object.freeze([
  Object.freeze({ text: "Quiz" }),
  Object.freeze({ text: "Wheelz", className: "text-[var(--qw-primary)]" }),
]);

export default function BrandLockup({ className = "", shuffleIntervalMs }) {
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
      <ShuffleText segments={BRAND_SEGMENTS} interval={shuffleIntervalMs} />
    </span>
  );
}
