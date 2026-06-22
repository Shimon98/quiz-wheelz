import { useEffect, useRef } from "react";
import { useLocaleContent } from "../../../../constants/localeConstants";
import { CREATE_RACE_CONTENT } from "../../content/teacherDashboardContent";
import {
    DASHBOARD_MODAL_STYLES,
    DASHBOARD_TEXT_STYLES,
} from "../../styles/dashboardUiStyles";
import DashboardButton from "../ui/DashboardButton";
import CreateRaceForm from "./CreateRaceForm";
import RaceFlagIcon from "../ui/RaceFlagIcon";
import { getTeacherDashboardAsset } from "../../constants/teacherDashboardAssets";
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

    const panelRef = useRef(null);
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
        if (!isOpen || isSubmitting) {
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
    }, [isOpen, isSubmitting, onClose]);

    if (!isOpen) {
        return null;
    }

    const errorMessage = typeof error === "string" ? error : error?.message ?? null;

    function handleOverlayClick(event) {
        if (event.target === event.currentTarget && !isSubmitting) {
            onClose();
        }
    }

    return (
        <div
            className={DASHBOARD_MODAL_STYLES.overlay}
            onMouseDown={handleOverlayClick}
        >
            <section
                ref={panelRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={MODAL_TITLE_ID}
                aria-describedby={MODAL_DESCRIPTION_ID}
                className={DASHBOARD_MODAL_STYLES.panel}
                dir="rtl"
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
            </section>
        </div>
    );
}