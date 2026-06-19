import { useLocaleContent } from "../../constants/localeConstants";
import { TEACHER_DASHBOARD_CONTENT } from "../../constants/teacherDashboardContent";
import { getTeacherDashboardAsset } from "../../constants/teacherDashboardAssets";

export default function TeacherHeroBanner() {
    const content = useLocaleContent(TEACHER_DASHBOARD_CONTENT).hero;
    const heroImage = getTeacherDashboardAsset("heroBackground");

    return (
        <section
            className="relative overflow-hidden rounded-[32px] bg-gradient-to-l from-sky-500 via-sky-400 to-purple-400 p-8 text-white shadow-[0_16px_40px_rgba(27,42,65,0.12)]"
            style={
                heroImage
                    ? {
                          backgroundImage: `url(${heroImage})`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                      }
                    : undefined
            }
        >
            <div className="relative z-10 max-w-lg">
                <h2 className="text-2xl font-bold md:text-3xl">{content.title}</h2>
                <p className="mt-2 text-sky-50">{content.subtitle}</p>
            </div>

            <span
                aria-hidden="true"
                className="absolute -bottom-4 -left-4 text-7xl opacity-30 md:text-8xl"
            >
                🏁
            </span>
        </section>
    );
}
