import { afterEach, describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { MantineProvider } from "@mantine/core";

import i18n from "../../../../i18n/i18n";
import { mapTeacherRaceResults } from "../../runtime/mapTeacherRaceResults";
import { teacherRaceResultsResponse } from "../../runtime/teacherRaceResultsTestFixtures";
import { buildTeacherRaceResultsViewModel } from "../../utils/buildTeacherRaceResultsViewModel";
import TeacherResultsAwards from "../TeacherResultsAwards";

const WHOLE_ROSTER_TIE = Object.freeze([{ type: "BEST_STREAK", racePlayerIds: [11, 12, 13, 14], value: 3 }]);
const TWO_WAY_TIE = Object.freeze([{ type: "MOST_CORRECT_ANSWERS", racePlayerIds: [11, 12], value: 9 }]);

async function renderAwardCard(language, awards) {
  await i18n.changeLanguage(language);
  const { awards: awardRows } = buildTeacherRaceResultsViewModel(
    mapTeacherRaceResults(teacherRaceResultsResponse({ awards })),
    language,
  );

  render(
    <MantineProvider>
      <TeacherResultsAwards awards={awardRows} />
    </MantineProvider>,
  );

  return screen.getByRole("listitem");
}

afterEach(async () => {
  await i18n.changeLanguage("he");
});

describe("TeacherResultsAwards", () => {
  it.each([
    ["he", "Noa, Dan ועוד 2", "Noa, Dan, Maya ו-Adi"],
    ["en", "Noa, Dan + 2 more", "Noa, Dan, Maya, and Adi"],
  ])("keeps a large %s tie short on screen and complete for screen readers and the tooltip", async (language, shortText, fullText) => {
    const card = await renderAwardCard(language, WHOLE_ROSTER_TIE);
    const shown = within(card).getByText(shortText);

    expect(shown).toHaveAttribute("aria-hidden", "true");
    expect(shown.parentElement).toHaveAttribute("title", fullText);
    expect(within(card).getByText(fullText)).not.toHaveAttribute("aria-hidden");
  });

  it("shows a two-way tie in full as plain text", async () => {
    const card = await renderAwardCard("en", TWO_WAY_TIE);
    const shown = within(card).getByText("Noa and Dan");

    expect(shown).toHaveAttribute("title", "Noa and Dan");
    expect(shown).not.toHaveAttribute("aria-hidden");
  });
});
