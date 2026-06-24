import { cx } from "../../../utils/classNameUtils";

const LOADING_STATE_STYLES = {
    grid:
        "grid gap-4",

    skeleton:
        "h-36 animate-pulse rounded-3xl bg-white/70 shadow-[0_10px_28px_rgba(27,42,65,0.06)]",
};

export default function LoadingState({
                                         itemCount = 3,
                                         className = "",
                                         skeletonClassName = "",
                                     }) {
    return (
        <div className={cx(LOADING_STATE_STYLES.grid, className)}>
            {Array.from({ length: itemCount }, (_, index) => (
                <div
                    key={index}
                    className={cx(
                        LOADING_STATE_STYLES.skeleton,
                        skeletonClassName,
                    )}
                />
            ))}
        </div>
    );
}