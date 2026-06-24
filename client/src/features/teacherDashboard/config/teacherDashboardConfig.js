export const TEACHER_RACES_PREVIEW_LIMIT = 4;

// Structural floors (px) that keep the dashboard races panel scroll-safe instead of
// clipping on short viewports — see the TeacherDashboardLayout scroll-ownership setup.
// RACES_PANEL_MIN_HEIGHT ≈ panel padding + header + one race card + the "Show all" footer.
export const RACES_PANEL_MIN_HEIGHT = 340;
// RACE_PREVIEW_VIEWPORT_MIN_HEIGHT ≈ one full race-card row, so useFittingRacePreviewCount
// always measures at least one card and never renders a clipped one.
export const RACE_PREVIEW_VIEWPORT_MIN_HEIGHT = 88;