import { describe, expect, it } from "vitest";

import { ROUTES } from "../../../../constants/routeConstants";
import {
  WORKSPACE_LIVE_RACE_BREAKPOINT,
  WORKSPACE_MOBILE_BREAKPOINT,
} from "../../config/teacherWorkspaceConfig";
import { resolveWorkspaceNavBreakpoint } from "../resolveWorkspaceNavBreakpoint";

describe("resolveWorkspaceNavBreakpoint", () => {
  it("collapses the workspace navigation earlier only on the live race projector", () => {
    expect(resolveWorkspaceNavBreakpoint("/teacher/races/7/live")).toBe(WORKSPACE_LIVE_RACE_BREAKPOINT);
  });

  it("keeps the default breakpoint on every other workspace page", () => {
    for (const pathname of [
      ROUTES.TEACHER_DASHBOARD,
      ROUTES.TEACHER_RACES,
      "/teacher/races/7/room",
      "/teacher/races/7/live/extra",
    ]) {
      expect(resolveWorkspaceNavBreakpoint(pathname)).toBe(WORKSPACE_MOBILE_BREAKPOINT);
    }
  });
});
