import { useLocaleContent } from "../../constants/localeConstants";
import { TEACHER_DASHBOARD_CONTENT } from "../../constants/teacherDashboardContent";
import {
    getTeacherDashboardAsset,
    getTeacherDashboardIcon,
} from "../../constants/teacherDashboardAssets";

const NAV_ITEMS = [
    { key: "dashboard", isActive: true, iconKey: "road" },
    { key: "races", isActive: false, iconKey: "flag" },
    { key: "createRace", isActive: false, iconKey: "pencil" },
    { key: "students", isActive: false, iconKey: "students", isComingSoon: true },
    { key: "subjects", isActive: false, isComingSoon: true },
    { key: "results", isActive: false, iconKey: "trophy", isComingSoon: true },
    { key: "settings", isActive: false, isComingSoon: true },
];

export default function TeacherSidebar() {
    const content = useLocaleContent(TEACHER_DASHBOARD_CONTENT).sidebar;
    const sidebarIllustration = getTeacherDashboardAsset("carNumbersTrail");
    const logo = getTeacherDashboardAsset("sidebarLogo");

    return (
        <aside className="hidden h-full min-h-0 w-60 flex-none overflow-hidden rounded-3xl bg-white/80 p-5 shadow-[0_8px_24px_rgba(27,42,65,0.08)] lg:block">
            <div className="flex h-full min-h-0 flex-col gap-6">
                <div className="flex shrink-0 items-center justify-center px-2">
                {logo ? (
                    <img
                        src={logo}
                        alt={content.logoText}
                        className="max-w-[180px] object-contain"
                        draggable="false"
                    />
                ) : (
                    <div className="flex items-center gap-2">
                        <span className="text-2xl">🏎️</span>
                        <span className="text-lg font-bold text-sky-700">
                            {content.logoText}
                        </span>
                    </div>
                )}
                </div>

                <nav className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto">
                    {NAV_ITEMS.map((item) => {
                        const icon = item.iconKey
                            ? getTeacherDashboardIcon(item.iconKey)
                            : null;

                        return (
                            <div
                                key={item.key}
                                className={`flex items-center justify-between rounded-2xl px-3 py-2.5 text-sm font-semibold transition ${
                                    item.isActive
                                        ? "bg-sky-500 text-white shadow-[0_8px_18px_rgba(30,123,230,0.35)]"
                                        : item.isComingSoon
                                          ? "text-slate-400"
                                          : "text-slate-700 hover:bg-sky-50"
                                }`}
                            >
                                <span className="flex items-center gap-2.5">
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
                                    {content.nav[item.key]}
                                </span>

                                {item.isComingSoon && (
                                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-400">
                                        {content.comingSoon}
                                    </span>
                                )}
                            </div>
                        );
                    })}
                </nav>

                {sidebarIllustration && (
                    <img
                        src={sidebarIllustration}
                        alt=""
                        aria-hidden="true"
                        className="mt-auto max-h-32 w-full shrink-0 border-t border-sky-100 object-contain pt-4 opacity-90"
                    />
                )}
            </div>
        </aside>
    );
}
