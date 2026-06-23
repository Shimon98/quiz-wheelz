import { getTeacherDashboardLucideIcon } from "../../constants/teacherDashboardIcons";
import SidebarNavItem from "./SidebarNavItem";

const SIDEBAR_NAVIGATION_STYLES = Object.freeze({
    nav:
        "flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto",
});

export default function SidebarNavigation({ items, content, onItemSelect }) {
    return (
        <nav className={SIDEBAR_NAVIGATION_STYLES.nav}>
            {items.map((item) => {
                const Icon = getTeacherDashboardLucideIcon(item.iconName);

                return (
                    <SidebarNavItem
                        key={item.key}
                        item={item}
                        label={content.nav[item.key]}
                        Icon={Icon}
                        comingSoonLabel={content.comingSoon}
                        onSelect={onItemSelect}
                    />
                );
            })}
        </nav>
    );
}