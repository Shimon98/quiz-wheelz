import { LogOut, User } from "lucide-react";
import { useLocaleContent } from "../../../../constants/localeConstants";
import Button from "../../../../shared/components/ui/Button";
import { TEACHER_DASHBOARD_CONTENT } from "../../content/teacherDashboardContent";
import { SIDEBAR_USER_CARD_STYLES } from "../../styles/dashboardUiStyles";

function getInitials(name) {
    if (!name) {
        return "";
    }

    return name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? "")
        .join("");
}

export default function SidebarUserCard({
                                            teacherName,
                                            onLogout,
                                            isLoggingOut = false,
                                        }) {
    const content = useLocaleContent(TEACHER_DASHBOARD_CONTENT).topBar;
    const displayName = teacherName ?? content.greetingFallback;
    const initials = getInitials(teacherName);

    return (
        <div className={SIDEBAR_USER_CARD_STYLES.wrapper}>
            <div className={SIDEBAR_USER_CARD_STYLES.card}>
                <span aria-hidden="true" className={SIDEBAR_USER_CARD_STYLES.avatar}>
                    {initials || (
                        <User className={SIDEBAR_USER_CARD_STYLES.avatarIcon} />
                    )}
                </span>

                <div className={SIDEBAR_USER_CARD_STYLES.textBlock}>
                    <p className={SIDEBAR_USER_CARD_STYLES.name}>{displayName}</p>
                    <p className={SIDEBAR_USER_CARD_STYLES.role}>{content.roleLabel}</p>
                </div>
            </div>

            <Button
                onClick={onLogout}
                disabled={isLoggingOut}
                variant="danger"
                size="sm"
                className={SIDEBAR_USER_CARD_STYLES.logoutButton}
            >
                <LogOut
                    aria-hidden="true"
                    className={SIDEBAR_USER_CARD_STYLES.logoutIcon}
                />
                <span>{isLoggingOut ? content.logoutLoading : content.logoutButton}</span>
            </Button>
        </div>
    );
}
