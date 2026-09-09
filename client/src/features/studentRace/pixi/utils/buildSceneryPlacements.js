import { getLoopPhase } from "./getLoopPhase";

const VARIATION = Object.freeze([
  0.17, 0.71, 0.38, 0.92, 0.05, 0.58, 0.83, 0.29, 0.64, 0.46, 0.11,
]);
const SIDES = Object.freeze([-1, 1]);
const RIGHT_PHASE_OFFSET = 0.43;
const SPACING_JITTER = 0.65;

function interpolateRange([min, max], ratio) {
  return min + (max - min) * ratio;
}

export function buildSceneryPlacements({ bands }) {
  const placements = [];

  Object.entries(bands).forEach(([band, config]) => {
    const { loopWorldLength } = config;
    const spacing = loopWorldLength / config.countPerSide;
    SIDES.forEach((side) => {
      const seed = config.seed + (side > 0 ? 5 : 0);
      for (let index = 0; index < config.countPerSide; index += 1) {
        const sample = (stride) =>
          VARIATION[(index * stride + seed) % VARIATION.length];
        const phase = side > 0 ? RIGHT_PHASE_OFFSET : 0;
        const position =
          (index + phase + (sample(1) - 0.5) * SPACING_JITTER) * spacing;

        placements.push(Object.freeze({
          id: `${band}-${side}-${index}`,
          band,
          prop: config.props[(index + seed) % config.props.length],
          side,
          worldPosition: getLoopPhase(position, loopWorldLength) * loopWorldLength,
          lateralRatio: interpolateRange(config.lateralRange, sample(3)),
          scale: interpolateRange(config.scaleRange, sample(5)),
          flip: sample(7) > 0.5,
        }));
      }
    });
  });

  return Object.freeze(placements);
}
