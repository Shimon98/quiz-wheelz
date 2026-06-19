import { useLocaleContent } from "../../constants/localeConstants";
import { TEACHER_DASHBOARD_CONTENT } from "../../constants/teacherDashboardContent";

export default function TeacherDashboardHeader({teacherName, isLoggingOut, onLogout,}) {
    const content = useLocaleContent(TEACHER_DASHBOARD_CONTENT);
    const displayName = teacherName ?? content.topBar.greetingFallback;

    return (
        <header className="rounded-3xl bg-white/80 p-6 shadow-md">
            <p className="text-sm font-semibold text-sky-600">
                {content.topBar.roleLabel}
            </p>

            <div className="mt-2 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">
                        {content.hero.title}
                    </h1>

                    <p className="mt-2 text-slate-600">
                        {displayName}, {content.hero.subtitle}
                    </p>
                </div>

                <button
                    type="button"
                    onClick={onLogout}
                    disabled={isLoggingOut}
                    className="rounded-2xl bg-red-500 px-6 py-3 font-bold text-white shadow-md transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {isLoggingOut
                        ? content.topBar.logoutLoading
                        : content.topBar.logoutButton}
                </button>
            </div>
        </header>
    );
}
