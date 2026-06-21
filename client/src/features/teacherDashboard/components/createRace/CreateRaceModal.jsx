import { useLocaleContent } from "../../../../constants/localeConstants";
import { CREATE_RACE_CONTENT } from "../../content/teacherDashboardContent";
import {
    DASHBOARD_MODAL_STYLES,
    DASHBOARD_TEXT_STYLES,
} from "../../styles/dashboardUiStyles";
import DashboardButton from "../ui/DashboardButton";
import CreateRaceForm from "./CreateRaceForm";
import RaceFlagIcon from "../ui/RaceFlagIcon";

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

    if (!isOpen) {
        return null;
    }

    const errorMessage = typeof error === "string" ? error : error?.message ?? null;

    return (
        <div className={DASHBOARD_MODAL_STYLES.overlay}>
            <section
                role="dialog"
                aria-modal="true"
                aria-labelledby="create-race-modal-title"
                className={DASHBOARD_MODAL_STYLES.panel}
                dir="rtl"
            >
                <DashboardButton
                    onClick={onClose}
                    aria-label={content.closeLabel}
                    disabled={isSubmitting}
                    variant="secondary"
                    size="sm"
                    className={DASHBOARD_MODAL_STYLES.closeButton}
                >
                    ×
                </DashboardButton>

                <div className={DASHBOARD_MODAL_STYLES.header}>
                    <div className={DASHBOARD_MODAL_STYLES.heroIcon}>🏎️</div>

                    <h2
                        id="create-race-modal-title"
                        className="flex items-center justify-center gap-3 text-3xl font-black leading-tight text-slate-900"
                    >
                        <RaceFlagIcon className="h-8 w-8 text-slate-900" />
                        <span>{content.title}</span>
                    </h2>

                    <p className={DASHBOARD_TEXT_STYLES.modalDescription}>
                        {content.description}
                    </p>
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