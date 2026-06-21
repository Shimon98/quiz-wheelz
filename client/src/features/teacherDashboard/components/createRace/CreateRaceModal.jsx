import {useLocaleContent} from "../../../../constants/localeConstants";
import {
    CREATE_RACE_CONTENT,
} from "../../content/teacherDashboardContent";
import DashboardButton from "../ui/DashboardButton";
import CreateRaceForm from "./CreateRaceForm";
import {
    DASHBOARD_MODAL_STYLES,
    DASHBOARD_TEXT_STYLES,
} from "../../styles/dashboardUiStyles";

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

    const errorMessage = typeof error === "string" ? error : null;

    return (
        <div className={DASHBOARD_MODAL_STYLES.overlay}>
            <section
                role="dialog"
                aria-modal="true"
                aria-labelledby="create-race-modal-title"
                className={DASHBOARD_MODAL_STYLES.panel}>
                dir="rtl"
                <DashboardButton
                    onClick={onClose}
                    aria-label={content.closeLabel}
                    disabled={isSubmitting}
                    variant="secondary"
                    size="sm"
                    className="absolute right-5 top-5 flex h-11 w-11 items-center justify-center rounded-2xl p-0 text-2xl leading-none"
                >
                    ×
                </DashboardButton>

                <div className="mx-auto max-w-xl text-center">
                    <div className="mb-1 text-5xl leading-none">🏎️</div>

                    <h2
                        id="create-race-modal-title"
                        className="text-3xl font-black leading-tight text-slate-900"
                    >
                        {content.title} 🏁
                    </h2>

                    <p className="mt-1 text-sm font-semibold text-slate-500">
                        {content.description}
                    </p>
                </div>

                {errorMessage && (
                    <div className="mt-5 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
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
