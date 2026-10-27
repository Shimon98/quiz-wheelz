import { render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import i18n from "../../../../i18n/i18n";
import { createInitialRaceRuntimeState } from "../../runtime/createInitialRaceRuntimeState";
import StudentRaceHud from "../StudentRaceHud";

function runtimeWithShield(guardShieldCharges, position = 0) {
  const state = createInitialRaceRuntimeState();
  return {
    ...state,
    totalDistance: 1000,
    player: { ...state.player, position },
    gameplay: {
      ...state.gameplay,
      powerUps: { guardShieldCharges, guardShieldAwardQuestionId: guardShieldCharges > 0 ? 7 : null },
    },
  };
}

const shieldReady = () => i18n.t("studentRace:hud.shieldReady");
const liveLine = (container) => container.querySelector(".student-race-hud > [aria-live='polite']");

describe("StudentRaceHud guard shield for screen readers", () => {
  const startLanguage = i18n.language;

  afterEach(() => i18n.changeLanguage(startLanguage));

  it("says nothing about a shield the student does not have", () => {
    const { container } = render(<StudentRaceHud runtimeState={runtimeWithShield(0)} />);

    expect(liveLine(container)).toBeEmptyDOMElement();
  });

  it("tells screen readers a shield is up, in a live line that adds nothing on screen", () => {
    const { container } = render(<StudentRaceHud runtimeState={runtimeWithShield(1)} />);

    expect(liveLine(container)).toHaveTextContent(shieldReady());
    expect(liveLine(container)).toHaveClass("sr-only");
  });

  it("keeps one live line while the race moves, so the shield is announced once, and clears it once used", () => {
    const { container, rerender } = render(<StudentRaceHud runtimeState={runtimeWithShield(1, 100)} />);
    const line = liveLine(container);

    rerender(<StudentRaceHud runtimeState={runtimeWithShield(1, 140)} />);
    rerender(<StudentRaceHud runtimeState={runtimeWithShield(1, 180)} />);
    expect(liveLine(container)).toBe(line);
    expect(line).toHaveTextContent(shieldReady());

    rerender(<StudentRaceHud runtimeState={runtimeWithShield(0, 220)} />);
    expect(liveLine(container)).toBe(line);
    expect(line).toBeEmptyDOMElement();
  });

  it.each(["he", "en"])("names the shield in %s", async (language) => {
    await i18n.changeLanguage(language);

    const { container } = render(<StudentRaceHud runtimeState={runtimeWithShield(1)} />);

    const text = i18n.getFixedT(language, "studentRace")("hud.shieldReady");
    expect(text).not.toBe("hud.shieldReady");
    expect(liveLine(container)).toHaveTextContent(text);
  });
});
