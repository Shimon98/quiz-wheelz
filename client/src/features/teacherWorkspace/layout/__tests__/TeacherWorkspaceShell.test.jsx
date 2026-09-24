import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { DEFAULT_THEME, MantineProvider } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";

import i18n from "../../../../i18n/i18n";
import { I18N_NAMESPACES } from "../../../../i18n/i18nConstants";
import { ROUTES } from "../../../../constants/routeConstants";
import {
  WORKSPACE_LIVE_RACE_BREAKPOINT,
  WORKSPACE_MOBILE_BREAKPOINT,
} from "../../config/teacherWorkspaceConfig";
import TeacherWorkspaceShell from "../TeacherWorkspaceShell";

vi.mock("@mantine/hooks", async (importOriginal) => ({
  ...(await importOriginal()),
  useMediaQuery: vi.fn(() => false),
}));

function renderShellAt(pathname) {
  return render(
    <MantineProvider>
      <MemoryRouter initialEntries={[pathname]}>
        <Routes>
          <Route element={<TeacherWorkspaceShell />}>
            <Route path={ROUTES.TEACHER_RACE_LIVE} element={<p>live page</p>} />
            <Route path={ROUTES.TEACHER_RACES} element={<p>races page</p>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </MantineProvider>,
  );
}

function headerQueries() {
  return vi.mocked(useMediaQuery).mock.calls.map(([query]) => query);
}

function burger() {
  return screen.getByRole("button", {
    name: i18n.t(`${I18N_NAMESPACES.TEACHER_WORKSPACE}:nav.menu`),
  });
}

beforeAll(() => {
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
});

afterAll(() => {
  vi.unstubAllGlobals();
});

afterEach(() => {
  vi.mocked(useMediaQuery).mockClear();
});

describe("TeacherWorkspaceShell navigation breakpoint", () => {
  it.each([
    ["/teacher/races/7/live", WORKSPACE_LIVE_RACE_BREAKPOINT],
    [ROUTES.TEACHER_RACES, WORKSPACE_MOBILE_BREAKPOINT],
  ])("on %s the header, the burger and the navbar all switch at %s", (pathname, breakpoint) => {
    renderShellAt(pathname);

    expect(new Set(headerQueries())).toEqual(
      new Set([`(min-width: ${DEFAULT_THEME.breakpoints[breakpoint]})`]),
    );
    expect(burger().className).toContain(`mantine-hidden-from-${breakpoint}`);
  });
});
