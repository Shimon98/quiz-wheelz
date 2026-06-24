import { matchPath } from "react-router-dom";

import { ROUTES } from "../../../constants/routeConstants";
import { TEACHER_DASHBOARD_NAV_ACTIONS } from "../constants/teacherDashboardConstants";

const TEACHER_RACE_ROUTE_PATTERNS = [
    ROUTES.TEACHER_RACE_ROOM,
    ROUTES.TEACHER_RACE_LIVE,
    ROUTES.TEACHER_RACE_RESULTS,
];

function matchesAnyRoute(pathname, patterns) {
    return patterns.some((path) => Boolean(matchPath({ path, end: false }, pathname)));
}

export function getActiveTeacherNavKey(pathname) {
    if (matchesAnyRoute(pathname, TEACHER_RACE_ROUTE_PATTERNS)) {
        return TEACHER_DASHBOARD_NAV_ACTIONS.RACES;
    }

    if (matchPath({ path: ROUTES.TEACHER_DASHBOARD, end: true }, pathname)) {
        return TEACHER_DASHBOARD_NAV_ACTIONS.DASHBOARD;
    }

    return null;
}
