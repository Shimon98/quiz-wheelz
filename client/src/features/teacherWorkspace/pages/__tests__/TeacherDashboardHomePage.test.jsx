import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { MantineProvider } from "@mantine/core";

import i18n from "../../../../i18n/i18n";
import { I18N_NAMESPACES } from "../../../../i18n/i18nConstants";
import TeacherDashboardHomePage from "../TeacherDashboardHomePage";
import useTeacherDashboardHome from "../../hooks/useTeacherDashboardHome";
import { buildDashboardStats } from "../../utils/dashboardStatsUtils";
import { teacherRaceSummary } from "./teacherRaceSummaryFixture";

const { navigateMock } = vi.hoisted(() => ({ navigateMock: vi.fn() }));

vi.mock("react-router-dom", async (importOriginal) => ({
  ...(await importOriginal()),
  useNavigate: () => navigateMock,
}));

vi.mock("../../hooks/useTeacherDashboardHome", () => ({
  default: vi.fn(),
}));

function text(key) {
  return i18n.t(`${I18N_NAMESPACES.TEACHER_WORKSPACE}:${key}`);
}

function renderDashboard(races) {
  useTeacherDashboardHome.mockReturnValue({
    teacherName: "Gojo",
    races,
    stats: buildDashboardStats({ races }),
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  });

  return render(
    <MantineProvider>
      <MemoryRouter>
        <TeacherDashboardHomePage />
      </MemoryRouter>
    </MantineProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("TeacherDashboardHomePage recent race actions", () => {
  it("offers Watch Live for a race in progress and opens the live route from the button and the row", () => {
    renderDashboard([teacherRaceSummary()]);

    expect(screen.queryByRole("button", { name: text("races.open") })).not.toBeInTheDocument();

    fireEvent.click(screen.getAllByRole("button", { name: text("racesPage.actions.watchLive") })[0]);
    fireEvent.click(screen.getByRole("row", { name: /Jungle Cup/ }));

    expect(navigateMock.mock.calls).toEqual([
      ["/teacher/races/7/live"],
      ["/teacher/races/7/live"],
    ]);
  });

  it("offers Open Room for a waiting race and opens its room from the button and the row", () => {
    renderDashboard([teacherRaceSummary({ status: "WAITING_FOR_PLAYERS" })]);

    fireEvent.click(screen.getAllByRole("button", { name: text("racesPage.actions.openRoom") })[0]);
    fireEvent.click(screen.getByRole("row", { name: /Jungle Cup/ }));

    expect(navigateMock.mock.calls).toEqual([
      ["/teacher/races/7/room"],
      ["/teacher/races/7/room"],
    ]);
  });
});
