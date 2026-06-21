import { useLocaleContent } from "../../../../constants/localeConstants";
import {
    CREATE_RACE_CONTENT,
} from "../../content/teacherDashboardContent";
import DashboardButton from "../ui/DashboardButton";
import CreateRaceForm from "./CreateRaceForm";

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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4">
            <section
                role="dialog"
                aria-modal="true"
                aria-labelledby="create-race-modal-title"
                className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 text-start shadow-2xl"
                dir="auto"
            >
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h2
                            id="create-race-modal-title"
                            className="text-2xl font-extrabold text-slate-900"
                        >
                            {content.title}
                        </h2>
                        <p className="mt-1 text-sm font-bold text-slate-500">
                            {content.description}
                        </p>
                    </div>

                    <DashboardButton
                        onClick={onClose}
                        aria-label={content.closeLabel}
                        disabled={isSubmitting}
                        variant="ghost"
                        size="sm"
                        className="flex h-10 w-10 shrink-0 items-center justify-center p-0 text-xl"
                    >
                        ×
                    </DashboardButton>
                </div>

                {errorMessage && (
                    <div className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
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
