import { TEACHER_RACE_PREVIEW_TEXT } from "../../constants/teacherDashboardConstants";

export default function TeacherRaceListPreview({ className = "" }) {
    return (
        <section
            className={`flex min-h-0 flex-col rounded-3xl bg-white/80 p-6 shadow-md ${className}`}
        >
            <div className="flex shrink-0 flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">
                        {TEACHER_RACE_PREVIEW_TEXT.racesTitle}
                    </h2>

                    <p className="mt-1 text-slate-600">
                        {TEACHER_RACE_PREVIEW_TEXT.racesDescription}
                    </p>
                </div>

                <button
                    type="button"
                    className="rounded-2xl bg-sky-500 px-6 py-3 font-bold text-white shadow-md transition hover:bg-sky-600"
                >
                    {TEACHER_RACE_PREVIEW_TEXT.createRaceButton}
                </button>
            </div>

            <div className="mt-6 flex min-h-[110px] flex-1 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-slate-500">
                {TEACHER_RACE_PREVIEW_TEXT.emptyRacesMessage}
            </div>
        </section>
    );
}
