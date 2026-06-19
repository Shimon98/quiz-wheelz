import { useLocaleContent } from "../../constants/localeConstants";
import { TEACHER_DASHBOARD_CONTENT } from "../../constants/teacherDashboardContent";
import { getTeacherDashboardAsset } from "../../constants/teacherDashboardAssets";
import TeacherTopBar from "./TeacherTopBar";

export default function TeacherHeroBanner({ teacherName, isLoggingOut, onLogout }) {
    const content = useLocaleContent(TEACHER_DASHBOARD_CONTENT).hero;
    const heroImage = getTeacherDashboardAsset("headerHero");

    return (
        <section className="relative h-[170px] max-h-[200px] overflow-hidden rounded-[28px] bg-gradient-to-l from-sky-500 via-sky-400 to-purple-400 text-white shadow-[0_16px_40px_rgba(27,42,65,0.12)] sm:h-[180px] lg:h-[190px]">
            {heroImage && (
                <img
                    src={heroImage}
                    alt=""
                    aria-hidden="true"
                    className="absolute inset-0 h-full w-full object-cover object-left-bottom"
                    draggable="false"
                />
            )}

            {heroImage && (
                <div
                    aria-hidden="true"
                    className="absolute inset-0 bg-gradient-to-l from-sky-950/80 via-sky-900/45 to-transparent"
                />
            )}

            <div className="relative z-10 flex h-full flex-col justify-between p-4">
                <div className="ml-auto">
                    <TeacherTopBar
                        teacherName={teacherName}
                        isLoggingOut={isLoggingOut}
                        onLogout={onLogout}
                    />
                </div>

                <div className="ml-auto max-w-md text-right">
                    <h2 className="text-lg font-bold md:text-xl">{content.title}</h2>
                    <p className="mt-1 text-sm text-sky-50">{content.subtitle}</p>
                </div>
            </div>
        </section>
    );
}
