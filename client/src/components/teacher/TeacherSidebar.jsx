import { useLocaleContent } from "../../constants/localeConstants";
import { TEACHER_DASHBOARD_CONTENT } from "../../constants/teacherDashboardContent";

const NAV_ITEMS = [
    { key: "dashboard", isActive: true },
    { key: "races", isActive: false },
    { key: "createRace", isActive: false },
    { key: "students", isActive: false, isComingSoon: true },
    { key: "subjects", isActive: false, isComingSoon: true },
    { key: "results", isActive: false, isComingSoon: true },
    { key: "settings", isActive: false, isComingSoon: true },
];

export default function TeacherSidebar() {
    const content = useLocaleContent(TEACHER_DASHBOARD_CONTENT).sidebar;

    return (
        <aside className="hidden w-64 flex-none flex-col gap-6 rounded-3xl bg-white/80 p-5 shadow-[0_8px_24px_rgba(27,42,65,0.08)] lg:flex">
            <div className="flex items-center gap-2 px-2">
                <span className="text-2xl">🏎️</span>
                <span className="text-lg font-bold text-sky-700">
                    {content.logoText}
                </span>
            </div>

            <nav className="flex flex-col gap-1.5">
                {NAV_ITEMS.map((item) => (
                    <div
                        key={item.key}
                        className={`flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                            item.isActive
                                ? "bg-sky-500 text-white shadow-[0_8px_18px_rgba(30,123,230,0.35)]"
                                : item.isComingSoon
                                  ? "text-slate-400"
                                  : "text-slate-700 hover:bg-sky-50"
                        }`}
                    >
                        <span>{content.nav[item.key]}</span>

                        {item.isComingSoon && (
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-400">
                                {content.comingSoon}
                            </span>
                        )}
                    </div>
                ))}
            </nav>
        </aside>
    );
}
