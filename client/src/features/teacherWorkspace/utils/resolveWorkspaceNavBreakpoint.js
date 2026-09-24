import { matchPath } from "react-router-dom";

import { ROUTES } from "../../../constants/routeConstants";
import {
  WORKSPACE_LIVE_RACE_BREAKPOINT,
  WORKSPACE_MOBILE_BREAKPOINT,
} from "../config/teacherWorkspaceConfig";

export function resolveWorkspaceNavBreakpoint(pathname) {
  return matchPath(ROUTES.TEACHER_RACE_LIVE, pathname)
    ? WORKSPACE_LIVE_RACE_BREAKPOINT
    : WORKSPACE_MOBILE_BREAKPOINT;
}
