import { Flag, LayoutDashboard, Settings } from "lucide-react";
import { ROUTES } from "../../../constants/routeConstants";

/*
 * Navigation items for the teacher workspace navbar. The same config will
 * serve future teacher pages (and an admin variant later) — pages pick their
 * `activeId`, the navbar just renders the list.
 *
 * Item shape:
 *   id       — stable key + activeId match
 *   labelKey — teacherWorkspace i18n key
 *   icon     — lucide icon component
 *   route    — navigate target (omit for non-route items)
 *   action   — named action handled by the shell ("settings")
 *   disabled — page not built yet; rendered with a "coming soon" chip,
 *              never a dead click
 */
export const WORKSPACE_NAV_ITEMS = Object.freeze([
  {
    id: "dashboard",
    labelKey: "nav.dashboard",
    icon: LayoutDashboard,
    route: ROUTES.TEACHER_DASHBOARD,
  },
  {
    id: "races",
    labelKey: "nav.races",
    icon: Flag,
    route: ROUTES.TEACHER_RACES,
  },
  {
    id: "settings",
    labelKey: "nav.settings",
    icon: Settings,
    action: "settings",
  },
]);
