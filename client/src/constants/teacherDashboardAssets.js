// No image assets exist in the repo yet. Every key resolves to null so
// consumers fall back to a gradient/emoji instead of a broken <img>.

const TEACHER_DASHBOARD_ASSETS = {
    heroBackground: null,
    sidebarLogo: null,
};

export function getTeacherDashboardAsset(key) {
    return TEACHER_DASHBOARD_ASSETS[key] ?? null;
}
