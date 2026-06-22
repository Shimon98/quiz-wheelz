import { useEffect, useRef } from "react";
import { useLocaleContent } from "../../../../constants/localeConstants";
import { CREATE_RACE_CONTENT } from "../../content/teacherDashboardContent";
import {
    DASHBOARD_MODAL_STYLES,
    DASHBOARD_TEXT_STYLES,
} from "../../styles/dashboardUiStyles";
import CreateRaceForm from "./CreateRaceForm";
import RaceFlagIcon from "../ui/RaceFlagIcon";
import { getTeacherDashboardAsset } from "../../constants/teacherDashboardAssets";
import Modal from "../../../../shared/components/ui/Modal";
import ModalCloseButton from "../../../../shared/components/ui/ModalCloseButton";

const MODAL_TITLE_ID = "create-race-modal-title";
const MODAL_DESCRIPTION_ID = "create-race-modal-description";

export default function CreateRaceModal({
                                            isOpen,
                                            onClose,
                                            onSubmit,
                                            subjects = [],
                                            isSubmitting = false,
                                            isLoadingSubjects = false,
                                            error = null,
                                        }) {
    const content = useLocaleContent(CREATE_RACE_CONTENT);
    const redRaceCar = getTeacherDashboardAsset("redRaceCar");

    const closeButtonRef = useRef(null);

    useEffect(() => {
        if (!isOpen) {
            return undefined;
        }

        closeButtonRef.current?.focus();

        return undefined;
    }, [isOpen]);

    const errorMessage = typeof error === "string" ? error : error?.message ?? null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            titleId={MODAL_TITLE_ID}
            descriptionId={MODAL_DESCRIPTION_ID}
            direction="rtl"
            closeOnEscape={!isSubmitting}
            closeOnOverlayClick={!isSubmitting}
            panelClassName={DASHBOARD_MODAL_STYLES.panel}
        >
            <ModalCloseButton
                ref={closeButtonRef}
                onClick={onClose}
                ariaLabel={content.closeLabel}
                disabled={isSubmitting}
                className={DASHBOARD_MODAL_STYLES.closeButton}
            />

            <div className={DASHBOARD_MODAL_STYLES.header}>
                <div className={DASHBOARD_MODAL_STYLES.headerContent} dir="ltr">
                    {redRaceCar && (
                        <img
                            src={redRaceCar}
                            alt=""
                            className={DASHBOARD_MODAL_STYLES.heroImage}
                        />
                    )}

                    <div className={DASHBOARD_MODAL_STYLES.titleBlock} dir="rtl">
                        <h2
                            id={MODAL_TITLE_ID}
                            className={DASHBOARD_TEXT_STYLES.modalTitle}
                        >
                            <RaceFlagIcon className={DASHBOARD_MODAL_STYLES.titleIcon} />
                            <span>{content.title}</span>
                        </h2>

                        <p
                            id={MODAL_DESCRIPTION_ID}
                            className={DASHBOARD_TEXT_STYLES.modalDescription}
                        >
                            {content.description}
                        </p>
                    </div>
                </div>
            </div>

            {errorMessage && (
                <div className={DASHBOARD_MODAL_STYLES.error}>
                    {errorMessage}
                </div>
            )}

            <CreateRaceForm
                subjects={subjects}
                isSubmitting={isSubmitting}
                isLoadingSubjects={isLoadingSubjects}
                content={content}
                onCancel={onClose}
                onSubmit={onSubmit}
            />
        </Modal>
    );
}