import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MantineProvider } from "@mantine/core";

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

  it("exposes a working retry action when degraded with an error", () => {
    const onRetry = vi.fn();
    render(
      <MantineProvider>
        <RacePlayerConnectionNotice
          connectionState={RACE_PLAYER_CONNECTION_STATES.RECONNECTING}
          error={{ messageKey: "general.unexpected" }}
          onRetry={onRetry}
        />
      </MantineProvider>,
    );

    fireEvent.click(
      screen.getByRole("button", { name: i18n.t("studentRace:status.retry") }),
    );
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("shows no retry action without an error", () => {
    render(
      <MantineProvider>
        <RacePlayerConnectionNotice
          connectionState={RACE_PLAYER_CONNECTION_STATES.RECONNECTING}
          onRetry={() => {}}
        />
      </MantineProvider>,
    );

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
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
