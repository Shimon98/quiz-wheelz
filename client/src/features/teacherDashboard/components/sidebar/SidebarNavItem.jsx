export default function SidebarNavItem({item, label, icon, comingSoonLabel,}) {
    return (
        <div
            className={`flex items-center justify-between rounded-2xl px-4 py-3 text-[15px] font-bold transition ${
                item.isActive
                    ? "bg-sky-500 text-white shadow-[0_8px_18px_rgba(30,123,230,0.35)]"
                    : item.isComingSoon
                        ? "text-slate-400"
                        : "text-slate-700 hover:bg-sky-50"
            }`}
        >
            <span className="flex items-center gap-3">
                {icon && (
                    <img
                        src={icon}
                        alt=""
                        aria-hidden="true"
                        className={`h-5 w-5 object-contain ${
                            item.isComingSoon ? "opacity-40" : ""
                        }`}
                    />
                )}

                {label}
            </span>

            {item.isComingSoon && (
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-400">
                    {comingSoonLabel}
                </span>
            )}
        </div>
    );
}