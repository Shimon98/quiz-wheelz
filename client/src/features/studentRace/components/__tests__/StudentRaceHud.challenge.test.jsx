import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "../../../../i18n/i18n";
import { createInitialRaceRuntimeState } from "../../runtime/createInitialRaceRuntimeState";
import StudentRaceHud from "../StudentRaceHud";

const NOW = 1_800_000_000_000;

function runtimeWith(gameplay) {
  const state = createInitialRaceRuntimeState();
  return { ...state, totalDistance: 1000, gameplay: { ...state.gameplay, ...gameplay } };
}

function challenge(overrides = {}) {
  return { energy: 75, threshold: 100, offer: null, run: null, lastResult: null, ...overrides };
}

const energyLabel = () => i18n.t("studentRace:hud.energyLabel");

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("StudentRaceHud challenge energy", () => {
  it("shows the server energy in normal racing", () => {
    render(<StudentRaceHud runtimeState={runtimeWith({ mode: "NORMAL", challenge: challenge() })} />);

    const meter = screen.getByRole("progressbar", { name: energyLabel() });
    expect(meter).toHaveAttribute("aria-valuenow", "75");
    expect(meter).toHaveAttribute("aria-valuemax", "100");
    expect(meter).toHaveAttribute("aria-valuetext", i18n.t("studentRace:hud.energyValue", { value: 75, max: 100 }));
    expect(meter).toHaveTextContent("75/100");
  });

  it("clamps a value above the threshold instead of overflowing the bar", () => {
    render(<StudentRaceHud runtimeState={runtimeWith({ mode: "NORMAL", challenge: challenge({ energy: 140 }) })} />);

    const meter = screen.getByRole("progressbar", { name: energyLabel() });
    expect(meter).toHaveAttribute("aria-valuenow", "100");
    expect(meter).toHaveTextContent("100/100");
  });

  it.each(["CHALLENGE_CHOICE", "TURBO_TRIAL", "SAFE_RUN"])("hides the meter in mode %s", (mode) => {
    render(<StudentRaceHud runtimeState={runtimeWith({ mode, challenge: challenge({ energy: 0 }) })} />);

    expect(screen.queryByRole("progressbar", { name: energyLabel() })).not.toBeInTheDocument();
  });

  it("shows no invented zero when the server energy is missing", () => {
    render(<StudentRaceHud runtimeState={runtimeWith({ mode: "NORMAL", challenge: null })} />);

    expect(screen.queryByRole("progressbar", { name: energyLabel() })).not.toBeInTheDocument();
  });
});

describe("StudentRaceHud challenge countdown", () => {
  it("replaces the question timer with the offer seconds and no progress bar", () => {
    const offer = { offerId: 17, expiresAtEpochMs: NOW + 9000, serverClockOffsetMs: 0, choices: ["SAFE_RUN"] };
    const question = { id: 3, expiresAtEpochMs: NOW + 15000, serverClockOffsetMs: 0, timeLimitSeconds: 20 };

    render(<StudentRaceHud runtimeState={runtimeWith({ mode: "CHALLENGE_CHOICE" })} question={question}
      challengeOffer={offer} />);

    const timer = screen.getByLabelText(i18n.t("studentRace:timer.challengeLabel"));
    expect(timer).toHaveTextContent("0:09");
    expect(timer.querySelector(".race-hud-timer-track")).toBeNull();
    expect(screen.queryByLabelText(i18n.t("studentRace:timer.label"))).not.toBeInTheDocument();
  });
});
