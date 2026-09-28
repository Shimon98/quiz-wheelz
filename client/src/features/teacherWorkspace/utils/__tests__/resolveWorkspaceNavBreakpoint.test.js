import { describe, expect, it } from "vitest";

import { ROUTES } from "../../../../constants/routeConstants";
import {
  WORKSPACE_MOBILE_BREAKPOINT,
  WORKSPACE_PROJECTOR_BREAKPOINT,
} from "../../config/teacherWorkspaceConfig";
import { resolveWorkspaceNavBreakpoint } from "../resolveWorkspaceNavBreakpoint";

describe("resolveWorkspaceNavBreakpoint", () => {
  it("collapses the workspace navigation earlier only on the projector screens", () => {
    expect(resolveWorkspaceNavBreakpoint("/teacher/races/7/live")).toBe(WORKSPACE_PROJECTOR_BREAKPOINT);
    expect(resolveWorkspaceNavBreakpoint("/teacher/races/7/results")).toBe(WORKSPACE_PROJECTOR_BREAKPOINT);
  });

  it("keeps the default breakpoint on every other workspace page", () => {
    for (const pathname of [
      ROUTES.TEACHER_DASHBOARD,
      ROUTES.TEACHER_RACES,
      "/teacher/races/7/room",
      "/teacher/races/7/live/extra",
      "/teacher/races/7/results/extra",
    ]) {
      expect(resolveWorkspaceNavBreakpoint(pathname)).toBe(WORKSPACE_MOBILE_BREAKPOINT);
    }
  });
});
