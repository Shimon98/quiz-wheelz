import { motion, useReducedMotion } from "framer-motion";

import { PLANT_PLACEMENTS } from "./jungleCornerPlantsConfig";
import plantTopLeft from "../../../assets/decor/plant-top-left.webp";
import plantTopRight from "../../../assets/decor/plant-top-right.webp";
import plantBottomLeft from "../../../assets/decor/plant-bottom-left.webp";
import plantBottomRight from "../../../assets/decor/plant-bottom-right.webp";
import plantsGroundStrip from "../../../assets/decor/plants-ground-strip.webp";

/*
 * JungleCornerPlants — painted jungle foliage pinned to the corners of its
 * container. THE shared decor component: any shell drops it inside an
 * absolutely-positioned, overflow-hidden, pointer-events-none layer and picks
 * which corners to fill. It knows nothing about pages.
 *
 * Placements are LOGICAL (start/end) so a composition mirrors as a whole
 * with the <html> dir. The art is painted for the Hebrew (RTL) sides —
 * ltr:-scale-x-100 flips it in English, same convention as the landing hero.
 *
 * Structure note: position + mirror-flip live on a WRAPPER span, the gentle
 * sway (framer-motion, reduced-motion → static) on the inner img — motion
 * owns the img transform inline and would clobber a CSS flip on the same
 * element. The ground strip never moves.
 */

// Corner width scales with the viewport between phone and desktop bounds.
const CORNER_SIZE = "w-[clamp(7rem,16vw,13rem)]";

const PLACEMENT_CONFIG = {
  // The PNGs are alpha-trimmed to their painted pixels, so a 0 inset means
  // the art really touches the wall/ceiling/floor of the container.
  [PLANT_PLACEMENTS.TOP_START]: {
    // RTL start = right → right-painted fern; flipped in LTR.
    src: plantTopRight,
    className: `absolute top-0 start-0 block ${CORNER_SIZE} ltr:-scale-x-100`,
    origin: "top center",
    sway: [0, 1.6, -1.1, 0],
    duration: 9,
    delay: 0,
  },
  [PLANT_PLACEMENTS.TOP_END]: {
    src: plantTopLeft,
    className: `absolute top-0 end-0 block ${CORNER_SIZE} ltr:-scale-x-100`,
    origin: "top center",
    sway: [0, -1.4, 1.2, 0],
    duration: 10,
    delay: 0.8,
  },
  [PLANT_PLACEMENTS.BOTTOM_START]: {
    src: plantBottomRight,
    className: `absolute bottom-0 start-0 block ${CORNER_SIZE} ltr:-scale-x-100`,
    origin: "bottom center",
    sway: [0, -1.2, 0.9, 0],
    duration: 8,
    delay: 0.4,
  },
  [PLANT_PLACEMENTS.BOTTOM_END]: {
    src: plantBottomLeft,
    className: `absolute bottom-0 end-0 block ${CORNER_SIZE} ltr:-scale-x-100`,
    origin: "bottom center",
    sway: [0, 1.3, -0.8, 0],
    duration: 11,
    delay: 1.1,
  },
  [PLANT_PLACEMENTS.GROUND_STRIP]: {
    src: plantsGroundStrip,
    className: "absolute bottom-0 inset-x-0 block w-full",
    origin: "bottom center",
    sway: null,
  },
};

export default function JungleCornerPlants({
  placements = [],
  opacity = 1,
  animate = true,
}) {
  const reduce = useReducedMotion();
  const still = reduce || !animate;

  return placements.map((placement) => {
    const cfg = PLACEMENT_CONFIG[placement];
    if (!cfg) {
      return null;
    }
    const sways = !still && cfg.sway;

    return (
      <span
        key={placement}
        aria-hidden="true"
        className={cfg.className}
        style={{ opacity }}
      >
        <motion.img
          src={cfg.src}
          alt=""
          draggable="false"
          decoding="async"
          className="h-auto w-full"
          style={{ transformOrigin: cfg.origin }}
          animate={sways ? { rotate: cfg.sway } : undefined}
          transition={
            sways
              ? {
                  duration: cfg.duration,
                  delay: cfg.delay,
                  repeat: Infinity,
                  ease: "easeInOut",
                }
              : undefined
          }
        />
      </span>
    );
  });
}
