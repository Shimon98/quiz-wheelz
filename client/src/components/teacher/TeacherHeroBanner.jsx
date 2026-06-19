import { useLocaleContent } from "../../constants/localeConstants";
import { TEACHER_DASHBOARD_CONTENT } from "../../constants/teacherDashboardContent";
import { getTeacherDashboardAsset } from "../../constants/teacherDashboardAssets";
import TeacherTopBar from "./TeacherTopBar";

export default function TeacherHeroBanner({ teacherName, isLoggingOut, onLogout }) {
    const content = useLocaleContent(TEACHER_DASHBOARD_CONTENT).hero;
    const heroImage = getTeacherDashboardAsset("headerHero");

    return (
        <section className="relative h-[180px] max-h-[210px] overflow-hidden rounded-[28px] bg-gradient-to-l from-sky-500 via-sky-400 to-purple-400 text-white shadow-[0_16px_40px_rgba(27,42,65,0.12)] sm:h-[190px] lg:h-[200px]">
            {heroImage && (
                <img
                    src={heroImage}
                    alt=""
                    aria-hidden="true"
                    className="absolute inset-0 h-full w-full object-cover object-left"
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
                    <h2 className="text-xl font-extrabold md:text-2xl">
                        {content.title}
                    </h2>
                    <p className="mt-1 text-sm font-semibold text-sky-50 md:text-base">
                        {content.subtitle}
                    </p>
                </div>
            </div>
        </section>
    );
}
