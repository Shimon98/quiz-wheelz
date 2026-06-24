import { useCallback, useLayoutEffect, useRef, useState } from "react";

function clampCount(count, minCount, maxCount, totalItems) {
    if (totalItems <= 0) {
        return 0;
    }

    const safeMax = Math.min(maxCount, totalItems);
    const safeMin = Math.min(minCount, safeMax);

    return Math.min(safeMax, Math.max(safeMin, count));
}

export function useFittingRacePreviewCount({
                                               totalItems,
                                               minCount = 1,
                                               maxCount = 4,
                                           }) {
    const viewportRef = useRef(null);

    const [visibleCount, setVisibleCount] = useState(() =>
        clampCount(maxCount, minCount, maxCount, totalItems),
    );

    const updateVisibleCount = useCallback(() => {
        const viewportElement = viewportRef.current;

        if (!viewportElement || totalItems <= 0) {
            setVisibleCount(0);
            return;
        }

        const firstCardItem = viewportElement.querySelector("[data-race-card-item]");

        if (!firstCardItem) {
            setVisibleCount(clampCount(maxCount, minCount, maxCount, totalItems));
            return;
        }

        const listElement = firstCardItem.parentElement;
        const availableHeight = viewportElement.clientHeight;
        const cardHeight = firstCardItem.getBoundingClientRect().height;
        const rowGap =
            Number.parseFloat(window.getComputedStyle(listElement).rowGap) || 0;

        if (availableHeight <= 0 || cardHeight <= 0) {
            setVisibleCount(clampCount(minCount, minCount, maxCount, totalItems));
            return;
        }

        const nextCount = Math.floor(
            (availableHeight + rowGap) / (cardHeight + rowGap),
        );

        setVisibleCount(
            clampCount(nextCount, minCount, maxCount, totalItems),
        );
    }, [maxCount, minCount, totalItems]);

    useLayoutEffect(() => {
        updateVisibleCount();

        const viewportElement = viewportRef.current;

        if (!viewportElement || typeof ResizeObserver === "undefined") {
            window.addEventListener("resize", updateVisibleCount);

            return () => {
                window.removeEventListener("resize", updateVisibleCount);
            };
        }

        const observer = new ResizeObserver(() => {
            updateVisibleCount();
        });

        observer.observe(viewportElement);

        return () => {
            observer.disconnect();
        };
    }, [updateVisibleCount]);

    return {
        viewportRef,
        visibleCount,
    };
}