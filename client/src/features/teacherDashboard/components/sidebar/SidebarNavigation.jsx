import { getTeacherDashboardLucideIcon } from "../../constants/teacherDashboardIcons";
import { TEACHER_SIDEBAR_STYLES } from "../../styles/dashboardUiStyles";
import SidebarNavItem from "./SidebarNavItem";

export default function SidebarNavigation({ items, content, onItemSelect }) {
    return (
        <div className={TEACHER_SIDEBAR_STYLES.navGroup}>
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
        </div>
    );
}
