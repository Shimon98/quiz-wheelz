import {
    BookOpen,
    Flag,
    Gauge,
    Home,
    Pencil,
    Settings,
    Trophy,
    Timer,
    Users,
} from "lucide-react";

export const TEACHER_DASHBOARD_LUCIDE_ICONS = Object.freeze({
    BookOpen,
    Flag,
    Gauge,
    Home,
    Pencil,
    Settings,
    Trophy,
    Timer,
    Users,
});

export function getTeacherDashboardLucideIcon(iconName) {
    return TEACHER_DASHBOARD_LUCIDE_ICONS[iconName] ?? null;
}