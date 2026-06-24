import { useEffect, useRef } from "react";
import { cx } from "../../../utils/classNameUtils";

const MODAL_STYLES = {
    overlay:
        "fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-[2px]",

    panel:
        "relative bg-white text-start shadow-[0_24px_80px_rgba(15,23,42,0.28)]",
};

export default function Modal({
                                  isOpen,
                                  onClose,
                                  children,
                                  titleId,
                                  descriptionId,
                                  direction = "rtl",
                                  closeOnOverlayClick = true,
                                  closeOnEscape = true,
                                  shouldRestoreFocus = true,
                                  overlayClassName = "",
                                  panelClassName = "",
                              }) {
    const previouslyFocusedElementRef = useRef(null);

    useEffect(() => {
        if (!isOpen || !shouldRestoreFocus) {
            return undefined;
        }

        previouslyFocusedElementRef.current = document.activeElement;

        return () => {
            previouslyFocusedElementRef.current?.focus?.();
        };
    }, [isOpen, shouldRestoreFocus]);

    useEffect(() => {
        if (!isOpen) {
            return undefined;
        }

        const originalBodyOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        return () => {
            document.body.style.overflow = originalBodyOverflow;
        };
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen || !closeOnEscape) {
            return undefined;
        }

        function handleKeyDown(event) {
            if (event.key === "Escape") {
                onClose?.();
            }
        }

        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [isOpen, closeOnEscape, onClose]);

    if (!isOpen) {
        return null;
    }

    function handleOverlayMouseDown(event) {
        if (closeOnOverlayClick && event.target === event.currentTarget) {
            onClose?.();
        }
    }

    return (
        <div
            className={cx(MODAL_STYLES.overlay, overlayClassName)}
            onMouseDown={handleOverlayMouseDown}
        >
            <section
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                aria-describedby={descriptionId}
                className={cx(MODAL_STYLES.panel, panelClassName)}
                dir={direction}
            >
                {children}
            </section>
        </div>
    );
}