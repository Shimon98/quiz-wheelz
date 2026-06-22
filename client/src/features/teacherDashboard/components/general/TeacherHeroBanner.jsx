import { memo } from "react";
import { useLocaleContent } from "../../../../constants/localeConstants.js";
import { TEACHER_DASHBOARD_CONTENT } from "../../content/teacherDashboardContent.js";
import { getTeacherDashboardAsset } from "../../constants/teacherDashboardAssets.js";
import TeacherTopBar from "./TeacherTopBar.jsx";

const HEIGHT_CLASSES_BY_SIZE = Object.freeze({
    default: "h-[180px] max-h-[210px] sm:h-[190px] lg:h-[200px]",
    compact: "h-28 max-h-32 sm:h-32 lg:h-36",
});

const TEACHER_HERO_BANNER_STYLES = Object.freeze({
    wrapper:
        "relative overflow-hidden rounded-3xl bg-gradient-to-l from-sky-500 via-sky-400 to-purple-400 text-white shadow-[0_16px_40px_rgba(27,42,65,0.12)]",

    image:
        "absolute inset-0 h-full w-full object-cover object-left",

    overlay:
        "absolute inset-0 bg-gradient-to-l from-sky-950/80 via-sky-900/45 to-transparent",

    content:
        "relative z-10 flex h-full flex-col justify-between p-4",

    topBarPosition:
        "ml-auto",

    textBlock:
        "ml-auto max-w-md text-right",

    title:
        "text-xl font-extrabold md:text-2xl",

    subtitle:
        "mt-1 text-sm font-semibold text-sky-50 md:text-base",
});

function TeacherHeroBanner({
                               teacherName,
                               isLoggingOut,
                               onLogout,
                               size = "default",
                           }) {
    const content = useLocaleContent(TEACHER_DASHBOARD_CONTENT).hero;
    const heroImage = getTeacherDashboardAsset("headerHero");
    const heightClasses = HEIGHT_CLASSES_BY_SIZE[size] ?? HEIGHT_CLASSES_BY_SIZE.default;

    return (
        <section
            className={`${TEACHER_HERO_BANNER_STYLES.wrapper} ${heightClasses}`}
        >
            {heroImage && (
                <img
                    src={heroImage}
                    alt=""
                    aria-hidden="true"
                    className={TEACHER_HERO_BANNER_STYLES.image}
                    draggable="false"
                />
            )}

            {heroImage && (
                <div
                    aria-hidden="true"
                    className={TEACHER_HERO_BANNER_STYLES.overlay}
                />
            )}

            <div className={TEACHER_HERO_BANNER_STYLES.content}>
                <div className={TEACHER_HERO_BANNER_STYLES.topBarPosition}>
                    <TeacherTopBar
                        teacherName={teacherName}
                        isLoggingOut={isLoggingOut}
                        onLogout={onLogout}
                    />
                </div>

                <div className={TEACHER_HERO_BANNER_STYLES.textBlock}>
                    <h2 className={TEACHER_HERO_BANNER_STYLES.title}>
                        {content.title}
                    </h2>

                    <p className={TEACHER_HERO_BANNER_STYLES.subtitle}>
                        {content.subtitle}
                    </p>
                </div>
            </div>
        </section>
    );
}

export default memo(TeacherHeroBanner);