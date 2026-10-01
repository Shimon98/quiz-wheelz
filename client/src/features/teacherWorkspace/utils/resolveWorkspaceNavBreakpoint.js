import { matchPath } from "react-router-dom";

import { ROUTES } from "../../../constants/routeConstants";
import {
  WORKSPACE_MOBILE_BREAKPOINT,
  WORKSPACE_PROJECTOR_BREAKPOINT,
} from "../config/teacherWorkspaceConfig";

const PROJECTOR_ROUTES = Object.freeze([ROUTES.TEACHER_RACE_LIVE, ROUTES.TEACHER_RACE_RESULTS]);

export function resolveWorkspaceNavBreakpoint(pathname) {
  return PROJECTOR_ROUTES.some((route) => matchPath(route, pathname))
    ? WORKSPACE_PROJECTOR_BREAKPOINT
    : WORKSPACE_MOBILE_BREAKPOINT;
}
