import { useLocaleContent } from "../../../constants/localeConstants";
import { TEACHER_DASHBOARD_CONTENT } from "../content/teacherDashboardContent";

export default function TeacherTopBar({ teacherName, isLoggingOut, onLogout }) {
    const content = useLocaleContent(TEACHER_DASHBOARD_CONTENT).topBar;
    const displayName = teacherName ?? content.greetingFallback;

    return (
        <div className="flex items-center gap-3 rounded-2xl bg-white/15 px-3 py-2 text-right shadow-sm backdrop-blur-md">
            <div className="min-w-0">
                <p className="truncate text-sm font-extrabold text-white drop-shadow-sm md:text-base">
                    {displayName}
                </p>
                <p className="text-[11px] font-bold text-sky-100 md:text-xs">
                    {content.roleLabel}
                </p>
            </div>

            <span
                aria-hidden="true"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-white/25 text-sm backdrop-blur-sm"
            >
                🔔
            </span>

            <button
                type="button"
                onClick={onLogout}
                disabled={isLoggingOut}
                className="shrink-0 rounded-xl bg-red-500 px-3 py-1.5 text-xs font-bold text-white shadow-md transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm"
            >
                {isLoggingOut ? content.logoutLoading : content.logoutButton}
            </button>
        </div>
    );
}
