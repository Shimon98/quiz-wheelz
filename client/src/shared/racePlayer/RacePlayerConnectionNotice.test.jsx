import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import i18n from "../../i18n/i18n";
import RacePlayerConnectionNotice from "./RacePlayerConnectionNotice";
import { RACE_PLAYER_CONNECTION_STATES } from "./racePlayerRuntimeSessionConfig";

// C1-05: only degraded states render; healthy shows nothing.

const noticeText = (key) => i18n.t(`studentRace:connection.${key}`);

describe("RacePlayerConnectionNotice", () => {
  it("renders the offline notice for OFFLINE", () => {
    render(
      <RacePlayerConnectionNotice
        connectionState={RACE_PLAYER_CONNECTION_STATES.OFFLINE}
      />,
    );

    const notice = screen.getByRole("status");
    expect(notice).toHaveTextContent(noticeText("offlineTitle"));
    expect(notice).toHaveTextContent(noticeText("offlineBody"));
  });

  it("renders the reconnecting notice for RECONNECTING", () => {
    render(
      <RacePlayerConnectionNotice
        connectionState={RACE_PLAYER_CONNECTION_STATES.RECONNECTING}
      />,
    );

    expect(screen.getByRole("status")).toHaveTextContent(
      noticeText("reconnectingTitle"),
    );
  });

  it("renders nothing for healthy or unresolved states", () => {
    for (const connectionState of [
      RACE_PLAYER_CONNECTION_STATES.CONNECTED,
      RACE_PLAYER_CONNECTION_STATES.CONNECTING,
      null,
    ]) {
      const { container, unmount } = render(
        <RacePlayerConnectionNotice connectionState={connectionState} />,
      );
      expect(container).toBeEmptyDOMElement();
      unmount();
    }
  });
});
