import { useLocaleContent } from "../../constants/localeConstants";
import { TEACHER_DASHBOARD_CONTENT } from "../../constants/teacherDashboardContent";
import { TEACHER_DASHBOARD_NAV_ITEMS } from "../../constants/teacherDashboardConstants";
import { getTeacherDashboardAsset } from "../../constants/teacherDashboardAssets";
import SidebarBrand from "./SidebarBrand";
import SidebarNavigation from "./SidebarNavigation";
import SidebarDecoration from "./SidebarDecoration";

export default function TeacherSidebar() {
    const content = useLocaleContent(TEACHER_DASHBOARD_CONTENT).sidebar;
    const sidebarIllustration = getTeacherDashboardAsset("carNumbersTrail");
    const logo = getTeacherDashboardAsset("sidebarLogo");

    return (
        <aside className="hidden h-full min-h-0 w-64 flex-none overflow-hidden rounded-3xl bg-white/80 p-5 shadow-[0_8px_24px_rgba(27,42,65,0.08)] lg:block">
            <div className="flex h-full min-h-0 flex-col gap-4">
                <SidebarBrand
                    logoSrc={logo}
                    logoText={content.logoText}
                />

                <SidebarNavigation
                    items={TEACHER_DASHBOARD_NAV_ITEMS}
                    content={content}
                />

                <SidebarDecoration imageSrc={sidebarIllustration} />
            </div>
        </aside>
    );
}