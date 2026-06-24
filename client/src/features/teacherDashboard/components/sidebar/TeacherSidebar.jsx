import { useLocaleContent } from "../../../../constants/localeConstants";
import { TEACHER_DASHBOARD_CONTENT } from "../../content/teacherDashboardContent";
import {
    TEACHER_DASHBOARD_NAV_ACTIONS,
    TEACHER_DASHBOARD_NAV_ITEMS,
} from "../../constants/teacherDashboardConstants";
import { getTeacherDashboardAsset } from "../../constants/teacherDashboardAssets";
import { TEACHER_SIDEBAR_STYLES } from "../../styles/dashboardUiStyles";
import CreateRaceButton from "../createRace/CreateRaceButton";
import SidebarBrand from "./SidebarBrand";
import SidebarNavigation from "./SidebarNavigation";
import SidebarUserCard from "./SidebarUserCard";

const PRIMARY_NAV_ITEMS = TEACHER_DASHBOARD_NAV_ITEMS.filter(
    (item) =>
        !item.isComingSoon &&
        item.actionKey !== TEACHER_DASHBOARD_NAV_ACTIONS.CREATE_RACE,
);

const COMING_SOON_NAV_ITEMS = TEACHER_DASHBOARD_NAV_ITEMS.filter(
    (item) => item.isComingSoon,
);

export default function TeacherSidebar({
    onDashboardClick,
    onRacesClick,
    onCreateRaceClick,
    teacherName,
    onLogout,
    isLoggingOut = false,
}) {
    const content = useLocaleContent(TEACHER_DASHBOARD_CONTENT).sidebar;
    const logo = getTeacherDashboardAsset("sidebarLogo");

    const navActions = {
        [TEACHER_DASHBOARD_NAV_ACTIONS.DASHBOARD]: onDashboardClick,
        [TEACHER_DASHBOARD_NAV_ACTIONS.RACES]: onRacesClick,
    };

    function handleNavItemSelect(item) {
        navActions[item.actionKey]?.();
    }

    return (
        <aside className={TEACHER_SIDEBAR_STYLES.aside}>
            <SidebarBrand logoSrc={logo} logoText={content.logoText} />

            <nav className={TEACHER_SIDEBAR_STYLES.navRegion}>
                <SidebarNavigation
                    items={PRIMARY_NAV_ITEMS}
                    content={content}
                    onItemSelect={handleNavItemSelect}
                />

                <div className={TEACHER_SIDEBAR_STYLES.ctaWrapper}>
                    <CreateRaceButton
                        onClick={onCreateRaceClick}
                        className={TEACHER_SIDEBAR_STYLES.cta}
                    >
                        {content.nav.createRace}
                    </CreateRaceButton>
                </div>

                <div className={TEACHER_SIDEBAR_STYLES.divider} />

                <SidebarNavigation
                    items={COMING_SOON_NAV_ITEMS}
                    content={content}
                    onItemSelect={handleNavItemSelect}
                />
            </nav>

            <SidebarUserCard
                teacherName={teacherName}
                onLogout={onLogout}
                isLoggingOut={isLoggingOut}
            />
        </aside>
    );
}
