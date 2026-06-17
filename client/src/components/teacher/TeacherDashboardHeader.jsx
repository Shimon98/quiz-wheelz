import { TEACHER_DASHBOARD_TEXT } from "../../constants/teacherDashboardConstants";

export default function TeacherDashboardHeader({teacherName, isLoggingOut, onLogout,}) {
    const displayName = teacherName ?? TEACHER_DASHBOARD_TEXT.greetingFallback;

    return (
        <header className="rounded-3xl bg-white/80 p-6 shadow-md">
            <p className="text-sm font-semibold text-sky-600">
                {TEACHER_DASHBOARD_TEXT.areaLabel}
            </p>

            <div className="mt-2 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">
                        {TEACHER_DASHBOARD_TEXT.title}
                    </h1>

                    <p className="mt-2 text-slate-600">
                        {TEACHER_DASHBOARD_TEXT.greetingPrefix} {displayName}, {" "}
                        {TEACHER_DASHBOARD_TEXT.subtitle}
                    </p>
                </div>

                <button
                    type="button"
                    onClick={onLogout}
                    disabled={isLoggingOut}
                    className="rounded-2xl bg-red-500 px-6 py-3 font-bold text-white shadow-md transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {isLoggingOut
                        ? TEACHER_DASHBOARD_TEXT.logoutLoading
                        : TEACHER_DASHBOARD_TEXT.logoutButton}
                </button>
            </div>
        </header>
    );
}