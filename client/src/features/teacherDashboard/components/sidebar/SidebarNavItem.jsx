import Badge from "../../../../shared/components/ui/Badge";
import { cx } from "../../../../utils/classNameUtils";
import { SIDEBAR_NAV_ITEM_STYLES } from "../../styles/dashboardUiStyles";

const RACING_ITEM_KEY = "races";

function getIconTileClass(item) {
    if (item.isActive) {
        return SIDEBAR_NAV_ITEM_STYLES.iconTileActive;
    }

    if (item.isComingSoon) {
        return SIDEBAR_NAV_ITEM_STYLES.iconTileComingSoon;
    }

    if (item.key === RACING_ITEM_KEY) {
        return SIDEBAR_NAV_ITEM_STYLES.iconTileRacing;
    }

    return SIDEBAR_NAV_ITEM_STYLES.iconTileIdle;
}

export default function SidebarNavItem({
                                           item,
                                           label,
                                           Icon,
                                           comingSoonLabel,
                                           onSelect,
                                       }) {
    function handleClick() {
        if (!item.isComingSoon) {
            onSelect?.(item);
        }
    }

    const buttonStateClass = item.isActive
        ? SIDEBAR_NAV_ITEM_STYLES.active
        : item.isComingSoon
            ? SIDEBAR_NAV_ITEM_STYLES.comingSoon
            : SIDEBAR_NAV_ITEM_STYLES.idle;

    return (
        <button
            type="button"
            onClick={handleClick}
            disabled={item.isComingSoon}
            aria-current={item.isActive ? "page" : undefined}
            className={cx(SIDEBAR_NAV_ITEM_STYLES.base, buttonStateClass)}
        >
            {item.isActive && (
                <span
                    aria-hidden="true"
                    className={SIDEBAR_NAV_ITEM_STYLES.indicator}
                />
            )}

            <span className={SIDEBAR_NAV_ITEM_STYLES.content}>
                <span className={cx(SIDEBAR_NAV_ITEM_STYLES.iconTile, getIconTileClass(item))}>
                    {Icon && (
                        <Icon
                            aria-hidden="true"
                            className={SIDEBAR_NAV_ITEM_STYLES.icon}
                        />
                    )}
                </span>

                <span className={SIDEBAR_NAV_ITEM_STYLES.label}>{label}</span>
            </span>

            {item.isComingSoon && (
                <Badge
                    size="sm"
                    className={SIDEBAR_NAV_ITEM_STYLES.comingSoonBadge}
                >
                    {comingSoonLabel}
                </Badge>
            )}
        </button>
    );
}
