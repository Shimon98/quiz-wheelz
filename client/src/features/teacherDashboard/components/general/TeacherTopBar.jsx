import { useLocaleContent } from "../../../../constants/localeConstants.js";
import Button from "../../../../shared/components/ui/Button";
import { TEACHER_DASHBOARD_CONTENT } from "../../content/teacherDashboardContent.js";

const TEACHER_TOP_BAR_STYLES = Object.freeze({
    wrapper:
        "flex items-center gap-3 rounded-2xl bg-white/15 px-3 py-2 text-right shadow-sm backdrop-blur-md",

    textBlock:
        "min-w-0",

    teacherName:
        "truncate text-sm font-extrabold text-white drop-shadow-sm md:text-base",

    roleLabel:
        "text-[11px] font-bold text-sky-100 md:text-xs",

    notificationIcon:
        "flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-white/25 text-sm backdrop-blur-sm",

    logoutButton:
        "shrink-0 rounded-xl px-3 py-1.5 text-xs sm:text-sm",
});

export default function TeacherTopBar({ teacherName, isLoggingOut, onLogout }) {
    const content = useLocaleContent(TEACHER_DASHBOARD_CONTENT).topBar;
    const displayName = teacherName ?? content.greetingFallback;

    return (
        <div className={TEACHER_TOP_BAR_STYLES.wrapper}>
            <div className={TEACHER_TOP_BAR_STYLES.textBlock}>
                <p className={TEACHER_TOP_BAR_STYLES.teacherName}>
                    {displayName}
                </p>

                <p className={TEACHER_TOP_BAR_STYLES.roleLabel}>
                    {content.roleLabel}
                </p>
            </div>

            <span
                aria-hidden="true"
                className={TEACHER_TOP_BAR_STYLES.notificationIcon}
            >
                🔔
            </span>

            <Button
                onClick={onLogout}
                disabled={isLoggingOut}
                variant="dangerSolid"
                size="sm"
                className={TEACHER_TOP_BAR_STYLES.logoutButton}
            >
                {isLoggingOut ? content.logoutLoading : content.logoutButton}
            </Button>
        </div>
    );
}