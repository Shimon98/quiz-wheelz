import { TEACHER_DASHBOARD_TEXT } from "../../constants/teacherDashboardConstants";

export default function TeacherRaceListPreview() {
    return (
        <section className="rounded-3xl bg-white/80 p-6 shadow-md">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">
                        {TEACHER_DASHBOARD_TEXT.racesTitle}
                    </h2>

                    <p className="mt-1 text-slate-600">
                        {TEACHER_DASHBOARD_TEXT.racesDescription}
                    </p>
                </div>

                <button
                    type="button"
                    className="rounded-2xl bg-sky-500 px-6 py-3 font-bold text-white shadow-md transition hover:bg-sky-600"
                >
                    {TEACHER_DASHBOARD_TEXT.createRaceButton}
                </button>
            </div>

            <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-500">
                {TEACHER_DASHBOARD_TEXT.emptyRacesMessage}
            </div>
        </section>
    );
}