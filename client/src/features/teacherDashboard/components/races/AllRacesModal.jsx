import {useEffect, useRef} from "react";

import {ALL_RACES_MODAL_STYLES} from "../../styles/dashboardUiStyles";
import ModalCloseButton from "../../../../shared/components/ui/ModalCloseButton";
import RaceList from "./RaceList";

const ALL_RACES_MODAL_TITLE_ID = "all-races-modal-title";
const ALL_RACES_MODAL_DESCRIPTION_ID = "all-races-modal-description";

export default function AllRacesModal({
                                          isOpen,
                                          onClose,
                                          races = [],
                                          content,
                                          raceContent,
                                          language,
                                          direction,
                                          onOpenRace,
                                          onEditRace,
                                          onCancelRace,
                                      }) {
    const closeButtonRef = useRef(null);
    const previouslyFocusedElementRef = useRef(null);

    useEffect(() => {
        if (!isOpen) {
            return undefined;
        }

        previouslyFocusedElementRef.current = document.activeElement;
        closeButtonRef.current?.focus();

        return () => {
            previouslyFocusedElementRef.current?.focus?.();
        };
    }, [isOpen]);

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
        if (!isOpen) {
            return undefined;
        }

        function handleKeyDown(event) {
            if (event.key === "Escape") {
                onClose();
            }
        }

        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [isOpen, onClose]);

    if (!isOpen) {
        return null;
    }

    function handleOverlayMouseDown(event) {
        if (event.target === event.currentTarget) {
            onClose();
        }
    }

    return (
        <div
            className={ALL_RACES_MODAL_STYLES.overlay}
            onMouseDown={handleOverlayMouseDown}
        >
            <section
                role="dialog"
                aria-modal="true"
                aria-labelledby={ALL_RACES_MODAL_TITLE_ID}
                aria-describedby={ALL_RACES_MODAL_DESCRIPTION_ID}
                className={ALL_RACES_MODAL_STYLES.panel}
                dir={direction}
            >
                <header className={ALL_RACES_MODAL_STYLES.header}>
                    <div>
                        <h2
                            id={ALL_RACES_MODAL_TITLE_ID}
                            className={ALL_RACES_MODAL_STYLES.title}
                        >
                            {content.allRacesTitle}
                        </h2>

                        <p
                            id={ALL_RACES_MODAL_DESCRIPTION_ID}
                            className={ALL_RACES_MODAL_STYLES.description}
                        >
                            {content.allRacesDescription}
                        </p>
                    </div>

                    <ModalCloseButton
                        ref={closeButtonRef}
                        onClick={onClose}
                        ariaLabel={content.closeAllRacesModal}
                        className={ALL_RACES_MODAL_STYLES.closeButton}
                    />
                </header>

                <div className={ALL_RACES_MODAL_STYLES.list}>
                    <RaceList
                        races={races}
                        content={raceContent}
                        language={language}
                        direction={direction}
                        onOpenRace={onOpenRace}
                        onEditRace={onEditRace}
                        onCancelRace={onCancelRace}
                    />
                </div>
            </section>
        </div>
    );
}