import { useLocaleContent } from "../../constants/localeConstants";
import { TEACHER_DASHBOARD_CONTENT } from "../../constants/teacherDashboardContent";

export default function TeacherTopBar({ teacherName, isLoggingOut, onLogout }) {
    const content = useLocaleContent(TEACHER_DASHBOARD_CONTENT).topBar;
    const displayName = teacherName ?? content.greetingFallback;

    return (
        <div className="flex items-center gap-2">
            <p className="text-xs font-semibold text-white drop-shadow-sm sm:text-sm">
                {displayName} · {content.roleLabel}
            </p>

            <span
                aria-hidden="true"
                className="flex h-7 w-7 items-center justify-center rounded-xl bg-white/25 text-sm backdrop-blur-sm"
            >
                🔔
            </span>

            <button
                type="button"
                onClick={onLogout}
                disabled={isLoggingOut}
                className="rounded-xl bg-red-500 px-3 py-1.5 text-xs font-bold text-white shadow-md transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm"
            >
                {isLoggingOut ? content.logoutLoading : content.logoutButton}
            </button>
        </div>
    );
}
