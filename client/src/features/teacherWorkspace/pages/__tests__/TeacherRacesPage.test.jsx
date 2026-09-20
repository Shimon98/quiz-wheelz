import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { MantineProvider } from "@mantine/core";

import i18n from "../../../../i18n/i18n";
import { I18N_NAMESPACES } from "../../../../i18n/i18nConstants";
import TeacherRacesPage from "../TeacherRacesPage";
import useTeacherRaces from "../../hooks/useTeacherRaces";
import { teacherRaceSummary as race } from "./teacherRaceSummaryFixture";

const { navigateMock } = vi.hoisted(() => ({ navigateMock: vi.fn() }));

vi.mock("react-router-dom", async (importOriginal) => ({
  ...(await importOriginal()),
  useNavigate: () => navigateMock,
}));

vi.mock("../../hooks/useTeacherRaces", () => ({
  default: vi.fn(),
}));

function renderPage(races) {
  useTeacherRaces.mockReturnValue({
    races,
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  });

  return render(
    <MantineProvider>
      <MemoryRouter>
        <TeacherRacesPage />
      </MemoryRouter>
    </MantineProvider>,
  );
}

function actionLabel(key) {
  return i18n.t(`${I18N_NAMESPACES.TEACHER_WORKSPACE}:racesPage.actions.${key}`);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("TeacherRacesPage row actions", () => {
  it("opens the live route for a race in progress", () => {
    renderPage([race()]);

    fireEvent.click(screen.getAllByRole("button", { name: actionLabel("watchLive") })[0]);

    expect(navigateMock).toHaveBeenCalledExactlyOnceWith("/teacher/races/7/live");
  });

  it("still opens the room for a waiting race", () => {
    renderPage([race({ status: "WAITING_FOR_PLAYERS" })]);

    fireEvent.click(screen.getAllByRole("button", { name: actionLabel("openRoom") })[0]);

    expect(navigateMock).toHaveBeenCalledExactlyOnceWith("/teacher/races/7/room");
  });
});
