import { afterEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MantineProvider } from "@mantine/core";

import i18n from "../../../../i18n/i18n";
import { RACE_VIEWS } from "../../../../shared/racePlayer/getRaceView";
import { readStoredJoinData, storeJoinData } from "../../utils/readStoredJoinData";
import StudentWaitingContent from "../StudentWaitingContent";

const JOIN_RESPONSE = {
  racePlayerId: 91,
  raceTitle: "Jungle Cup",
  roomCode: "ABC123",
  currentPlayers: 3,
  maxPlayers: 8,
  token: "fake-test-token",
  player: { racePlayerId: 91, displayName: "נועה", laneNumber: 3 },
};
const RACE_STATE = {
  raceTitle: "Jungle Cup",
  roomCode: "ABC123",
  snapshot: { raceStatus: "WAITING_FOR_PLAYERS", playerStatus: "WAITING" },
};

afterEach(async () => {
  sessionStorage.clear();
  await i18n.changeLanguage("he");
});

describe.each(["he", "en"])("StudentWaitingContent from the stored display fields (%s)", (language) => {
  it("shows the name, lane, players and room code as before", async () => {
    await i18n.changeLanguage(language);
    storeJoinData(JOIN_RESPONSE);

    render(
      <MantineProvider>
        <StudentWaitingContent joinData={readStoredJoinData()} raceState={RACE_STATE} view={RACE_VIEWS.WAITING}
          isLoading={false} error={null} retry={() => {}} />
      </MantineProvider>,
    );

    expect(screen.getByRole("heading", { name: i18n.t("studentJoin:waiting.hello", { name: "נועה" }) })).toBeTruthy();
    expect(screen.getByText(i18n.t("studentJoin:waiting.laneLabel"))).toBeTruthy();
    expect(screen.getByText("3/8")).toBeTruthy();
    expect(screen.getByText("ABC123")).toBeTruthy();
    expect(screen.getByText("Jungle Cup")).toBeTruthy();
  });
});
