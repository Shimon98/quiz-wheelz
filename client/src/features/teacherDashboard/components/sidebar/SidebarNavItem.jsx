import Badge from "../../../../shared/components/ui/Badge";
import { cx } from "../../../../utils/classNameUtils";

const SIDEBAR_NAV_ITEM_STYLES = Object.freeze({
    button:
        "flex w-full items-center justify-between rounded-2xl px-4 py-3 text-start text-[15px] font-bold transition disabled:cursor-not-allowed",

    active:
        "bg-sky-500 text-white shadow-[0_8px_18px_rgba(30,123,230,0.35)]",

    idle:
        "text-slate-700 hover:bg-sky-50",

    comingSoon:
        "text-slate-400",

    content:
        "flex items-center gap-3",

    icon:
        "h-5 w-5 shrink-0",

    iconMuted:
        "opacity-40",

    comingSoonBadge:
        "bg-slate-100 text-slate-400",
});

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
            className={cx(SIDEBAR_NAV_ITEM_STYLES.button, buttonStateClass)}
        >
            <span className={SIDEBAR_NAV_ITEM_STYLES.content}>
                {Icon && (
                    <Icon
                        aria-hidden="true"
                        className={cx(
                            SIDEBAR_NAV_ITEM_STYLES.icon,
                            item.isComingSoon && SIDEBAR_NAV_ITEM_STYLES.iconMuted,
                        )}
                    />
                )}

                {label}
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