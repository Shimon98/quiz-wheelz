import { useEffect, useRef } from "react";

import { ALL_RACES_MODAL_STYLES } from "../../styles/dashboardUiStyles";
import Modal from "../../../../shared/components/ui/Modal";
import ModalCloseButton from "../../../../shared/components/ui/ModalCloseButton";
import EmptyRacesState from "./EmptyRacesState";
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
                                          onCreateRaceClick,
                                      }) {
    const closeButtonRef = useRef(null);
    const hasRaces = races.length > 0;

    useEffect(() => {
        if (!isOpen) {
            return undefined;
        }

        closeButtonRef.current?.focus();

        return undefined;
    }, [isOpen]);

    function handleCreateRaceClick() {
        onClose?.();
        onCreateRaceClick?.();
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            titleId={ALL_RACES_MODAL_TITLE_ID}
            descriptionId={ALL_RACES_MODAL_DESCRIPTION_ID}
            direction={direction}
            panelClassName={ALL_RACES_MODAL_STYLES.panel}
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
                {hasRaces ? (
                    <RaceList
                        races={races}
                        content={raceContent}
                        language={language}
                        direction={direction}
                        onOpenRace={onOpenRace}
                        onEditRace={onEditRace}
                        onCancelRace={onCancelRace}
                    />
                ) : (
                    <EmptyRacesState
                        message={content.emptyRacesMessage}
                        createRaceLabel={content.createRaceButton}
                        onCreateRaceClick={handleCreateRaceClick}
                    />
                )}
            </div>
        </Modal>
    );
}