import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MantineProvider } from "@mantine/core";

import i18n from "../../../../i18n/i18n";
import { STUDENT_RACE_CHALLENGE_PHASE as PHASE } from "../../runtime/studentRaceRuntimeConstants";
import StudentRaceChallengePanel from "../StudentRaceChallengePanel";

const BOTH = ["TURBO_TRIAL", "SAFE_RUN"];

function offer(choices = BOTH) {
  return { offerId: 17, expiresAtEpochMs: Date.now() + 9000, serverClockOffsetMs: 0, choices };
}

const turboName = () => new RegExp(i18n.t("studentRace:gameplay.turbo.title"));
const safeName = () => new RegExp(i18n.t("studentRace:gameplay.safe.title"));
const resyncName = () => i18n.t("studentRace:gameplay.choice.resync");

function renderPanel(props) {
  return render(
    <MantineProvider>
      <StudentRaceChallengePanel interactionEnabled onChoose={vi.fn()} onResync={vi.fn()} {...props} />
    </MantineProvider>,
  );
}

describe("StudentRaceChallengePanel", () => {
  it("shows one illustrated card per server choice and reports the pick", () => {
    const onChoose = vi.fn();
    renderPanel({ offer: offer(), openChoices: BOTH, onChoose });

    expect(screen.getByRole("status")).toHaveTextContent(i18n.t("studentRace:gameplay.choice.title"));
    expect(screen.getByRole("button", { name: turboName() }))
      .toHaveTextContent(i18n.t("studentRace:gameplay.turbo.description"));
    expect(document.querySelectorAll(".race-challenge-art")).toHaveLength(2);

    fireEvent.click(screen.getByRole("button", { name: safeName() }));

    expect(onChoose).toHaveBeenCalledExactlyOnceWith("SAFE_RUN");
  });

  it("renders only the choices the server offered", () => {
    renderPanel({ offer: offer(["SAFE_RUN"]), openChoices: ["SAFE_RUN"] });

    expect(screen.getAllByRole("button")).toHaveLength(1);
    expect(screen.queryByRole("button", { name: turboName() })).not.toBeInTheDocument();
  });

  it.each([
    ["submitting", { phase: PHASE.SUBMITTING, selectedChoice: "TURBO_TRIAL" }, "gameplay.choice.submitting"],
    ["checking an unverified choice", { phase: PHASE.RECONCILING, selectedChoice: "TURBO_TRIAL" },
      "gameplay.choice.reconciling"],
    ["expired", { isExpired: true }, "gameplay.choice.expired"],
    ["checking an unverified choice past the deadline",
      { phase: PHASE.RECONCILING, selectedChoice: "SAFE_RUN", isExpired: true }, "gameplay.choice.reconciling"],
  ])("locks every card while %s", (_, state, statusKey) => {
    renderPanel({ offer: offer(), ...state });

    expect(screen.getByRole("status")).toHaveTextContent(i18n.t(`studentRace:${statusKey}`));
    screen.getAllByRole("button").forEach((card) => expect(card).toBeDisabled());
  });

  it("keeps the cards locked while gameplay is not interactive", () => {
    renderPanel({ offer: offer(), openChoices: BOTH, interactionEnabled: false });

    screen.getAllByRole("button").forEach((card) => expect(card).toBeDisabled());
  });

  it("lets only the first choice be sent again without claiming it failed", () => {
    renderPanel({ offer: offer(), phase: PHASE.RETRY_SAME_CHOICE, selectedChoice: "TURBO_TRIAL",
      openChoices: ["TURBO_TRIAL"] });

    expect(screen.getByRole("status")).toHaveTextContent(i18n.t("studentRace:gameplay.choice.retry"));
    expect(screen.getByRole("button", { name: turboName() })).toBeEnabled();
    expect(screen.getByRole("button", { name: safeName() })).toBeDisabled();
    expect(screen.queryByText(/CHALLENGE_/)).not.toBeInTheDocument();
  });

  it("offers a manual sync after a failed check", () => {
    const onResync = vi.fn();
    renderPanel({ offer: offer(), phase: PHASE.SYNC_FAILED, selectedChoice: "TURBO_TRIAL", onResync });

    expect(screen.getByRole("status")).toHaveTextContent(i18n.t("studentRace:gameplay.choice.syncFailed"));
    expect(screen.getByRole("button", { name: turboName() })).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: resyncName() }));

    expect(onResync).toHaveBeenCalledTimes(1);
  });

  it("shows a calm syncing state with a manual sync when the offer is unreadable", () => {
    const onResync = vi.fn();
    renderPanel({ onResync });

    expect(screen.getByRole("status")).toHaveTextContent(i18n.t("studentRace:gameplay.choice.syncing"));
    fireEvent.click(screen.getByRole("button", { name: resyncName() }));

    expect(onResync).toHaveBeenCalledTimes(1);
    expect(screen.getAllByRole("button")).toHaveLength(1);
  });

  it("hides the manual sync while a sync is running or gameplay is not interactive", () => {
    const { unmount } = renderPanel({ phase: PHASE.RECONCILING });

    expect(screen.getByRole("status")).toHaveTextContent(i18n.t("studentRace:gameplay.choice.syncing"));
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    unmount();

    renderPanel({ phase: PHASE.SYNC_FAILED, interactionEnabled: false });

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
