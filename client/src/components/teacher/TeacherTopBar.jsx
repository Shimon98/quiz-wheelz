import { useLocaleContent } from "../../constants/localeConstants";
import { TEACHER_DASHBOARD_CONTENT } from "../../constants/teacherDashboardContent";

export default function TeacherTopBar({ teacherName, isLoggingOut, onLogout }) {
    const content = useLocaleContent(TEACHER_DASHBOARD_CONTENT);
    const displayName = teacherName ?? content.topBar.greetingFallback;

    return (
        <header className="flex items-center justify-between rounded-3xl bg-white/80 px-6 py-4 shadow-[0_8px_24px_rgba(27,42,65,0.08)]">
            <div>
                <p className="text-xs font-semibold text-sky-600">
                    {content.areaLabel}
                </p>
                <p className="text-lg font-bold text-slate-900">
                    {displayName} · {content.topBar.roleLabel}
                </p>
            </div>

            <div className="flex items-center gap-3">
                <span
                    aria-hidden="true"
                    className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-50 text-lg"
                >
                    🔔
                </span>

                <button
                    type="button"
                    onClick={onLogout}
                    disabled={isLoggingOut}
                    className="rounded-2xl bg-red-500 px-5 py-2.5 font-bold text-white shadow-md transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {isLoggingOut
                        ? content.topBar.logoutLoading
                        : content.topBar.logoutButton}
                </button>
            </div>
        </header>
    );
}
