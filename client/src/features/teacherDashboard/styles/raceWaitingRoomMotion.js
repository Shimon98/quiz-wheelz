const EASE_OUT_STRONG = [0.23, 1, 0.32, 1];

export const ENTRANCE_TRANSITION = Object.freeze({
    duration: 0.22,
    ease: EASE_OUT_STRONG,
});

export const FADE_UP_VARIANTS = Object.freeze({
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
});

export const FADE_SCALE_VARIANTS = Object.freeze({
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1 },
});

export const STAGGER_CONTAINER_VARIANTS = Object.freeze({
    hidden: {},
    visible: {
        transition: { staggerChildren: 0.04 },
    },
});
