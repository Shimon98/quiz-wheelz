import teacherDashboardHeaderHero from "../assets/backgrounds/TeacherDashboardHeaderHero.png";
import generalBackground from "../assets/backgrounds/GeneralBackground.png";
import carNumbersTrail from "../assets/illustrations/car-numbers-trail.png";
import sidebarLogo from "../assets/logos/gameLogo.png";

import flagIcon from "../assets/icons/flag.png";
import pencilIcon from "../assets/icons/pencil.png";
import roadIcon from "../assets/icons/road.png";
import stopwatchIcon from "../assets/icons/stopwatch.png";
import studentsIcon from "../assets/icons/students.png";
import trophyIcon from "../assets/icons/trophy.png";

const TEACHER_DASHBOARD_ASSETS = {
    headerHero: teacherDashboardHeaderHero,
    generalBackground,
    carNumbersTrail,
    sidebarLogo,
};

const TEACHER_DASHBOARD_ICONS = {
    flag: flagIcon,
    pencil: pencilIcon,
    road: roadIcon,
    stopwatch: stopwatchIcon,
    students: studentsIcon,
    trophy: trophyIcon,
};

export function getTeacherDashboardAsset(key) {
    return TEACHER_DASHBOARD_ASSETS[key] ?? null;
}

export function getTeacherDashboardIcon(key) {
    return TEACHER_DASHBOARD_ICONS[key] ?? null;
}
