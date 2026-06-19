import { getTeacherDashboardIcon } from "../../constants/teacherDashboardAssets";
import SidebarNavItem from "./SidebarNavItem";

export default function SidebarNavigation({ items, content }) {
    return (
        <nav className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto">
            {items.map((item) => {
                const icon = item.iconKey
                    ? getTeacherDashboardIcon(item.iconKey)
                    : null;

                return (
                    <SidebarNavItem
                        key={item.key}
                        item={item}
                        label={content.nav[item.key]}
                        icon={icon}
                        comingSoonLabel={content.comingSoon}
                    />
                );
            })}
        </nav>
    );
}