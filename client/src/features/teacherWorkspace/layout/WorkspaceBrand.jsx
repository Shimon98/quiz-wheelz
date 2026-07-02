import { motion, useReducedMotion } from "framer-motion";
import ShuffleText from "../../../shared/components/publicEntry/ShuffleText";
import bananaMark from "../../../assets/brand/quizwheelz-mark.png";

/*
 * WorkspaceBrand — the QuizWheelz lockup for the workspace chrome (navbar +
 * mobile header). Same playful identity as the landing shell: the banana mark
 * before the "Q" and the ShuffleText title that occasionally re-scrambles.
 * Extra surprise: hovering the banana makes it tip over, then it springs back.
 * Purely decorative — dir="ltr" keeps the Latin lockup stable in RTL, and the
 * aria-label carries the real brand name.
 */
export default function WorkspaceBrand({ size = "md" }) {
  const reduce = useReducedMotion();
  const textClass =
    size === "sm" ? "text-lg font-extrabold" : "text-2xl font-extrabold";

  return (
    <span
      dir="ltr"
      className="inline-flex items-center whitespace-nowrap"
      aria-label="QuizWheelz"
    >
      <motion.img
        src={bananaMark}
        alt=""
        aria-hidden="true"
        draggable="false"
        className="me-1 inline-block h-[1.35em] w-auto shrink-0"
        style={{ fontSize: size === "sm" ? "1.125rem" : "1.5rem" }}
        whileHover={reduce ? undefined : { rotate: -24, scale: 1.15 }}
        transition={{ type: "spring", stiffness: 300, damping: 12 }}
      />
      <ShuffleText
        className={textClass}
        segments={[
          { text: "Quiz" },
          { text: "Wheelz", className: "text-[var(--qw-primary)]" },
        ]}
      />
    </span>
  );
}
