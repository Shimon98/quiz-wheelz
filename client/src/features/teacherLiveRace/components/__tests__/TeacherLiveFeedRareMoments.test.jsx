import { afterEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MantineProvider } from "@mantine/core";

import i18n from "../../../../i18n/i18n";
import TeacherLiveEventsPanel from "../events/TeacherLiveEventsPanel";
import { TEACHER_FEED_KINDS, TEACHER_FEED_PRESENTATION } from "../../config/teacherLiveFeedConfig";
import { mapTeacherRaceLiveState } from "../../runtime/mapTeacherRaceLiveState";
import { mapTeacherLiveEventEnvelope } from "../../runtime/liveEvents/mapTeacherLiveEventEnvelope";
import {
  INITIAL_TEACHER_LIVE_STATE,
  TEACHER_LIVE_ACTIONS,
  teacherRaceLiveReducer,
} from "../../runtime/teacherRaceLiveReducer";
import { teacherLiveEvent, teacherLiveStateResponse } from "../../runtime/teacherRaceLiveTestFixtures";

// The three feed kinds the 2026-11-08 live race did not draw (a Tailwind, a Mud and the race's end), checked through
// the real pipeline: the server's envelopes, the mapper, the reducer with its admission, then the panel.
const SERVER_NOW = teacherLiveStateResponse().serverTimeEpochMs;
const LOADED_AT = 500;
const ROSTER = teacherLiveEvent().payload.players;

function receive(state, event) {
  return teacherRaceLiveReducer(state, {
    type: TEACHER_LIVE_ACTIONS.LIVE_EVENT_RECEIVED,
    event: mapTeacherLiveEventEnvelope(teacherLiveEvent(event)),
    // Arrives as it happens, so admission treats it as live news, not as a late replay.
    receivedAtPerformanceNow: LOADED_AT + (event.occurredAtEpochMs - SERVER_NOW),
  });
}

function raceWithTheRareMoments() {
  const at = SERVER_NOW + 1_000;
  let state = teacherRaceLiveReducer(INITIAL_TEACHER_LIVE_STATE, {
    type: TEACHER_LIVE_ACTIONS.AUTHORITATIVE_STATE_LOADED,
    raceId: "7",
    runtime: mapTeacherRaceLiveState(teacherLiveStateResponse()),
    receivedAtPerformanceNow: LOADED_AT,
  });
  // Noa's correct answer with a Tailwind, told once its progress event arrives.
  state = receive(state, { version: 13, type: "QUESTION_ANSWERED", occurredAtEpochMs: at,
    payload: { racePlayerId: 91, questionId: 1, correct: true, moments: [{ kind: "LUCK_TAILWIND", sourceId: 3 }] } });
  state = receive(state, { version: 14, type: "PLAYER_PROGRESS_UPDATED", occurredAtEpochMs: at, payload: { players: ROSTER } });
  // Dan's wrong answer with a Mud, judged at once, in the next pace window.
  state = receive(state, { version: 15, type: "QUESTION_ANSWERED", occurredAtEpochMs: at + 6_000,
    payload: { racePlayerId: 92, questionId: 2, correct: false, moments: [{ kind: "LUCK_MUD", sourceId: 4 }] } });
  state = receive(state, { version: 16, type: "RACE_FINISHED", occurredAtEpochMs: at + 12_000,
    payload: { raceStatus: "FINISHED", finishedAtEpochMs: at + 12_000, players: ROSTER } });
  return { items: state.recentEvents, now: at + 13_000 };
}

const EXPECTED = {
  he: {
    [TEACHER_FEED_KINDS.LUCK_TAILWIND]: "וווש! הרוח דוחפת את Noa!",
    [TEACHER_FEED_KINDS.LUCK_MUD]: "פלופ! שלולית בדרך של Dan!",
    [TEACHER_FEED_KINDS.RACE_FINISHED]: "פיניש! המרוץ הסתיים!",
  },
  en: {
    [TEACHER_FEED_KINDS.LUCK_TAILWIND]: "Whoosh! A tailwind boosts Noa!",
    [TEACHER_FEED_KINDS.LUCK_MUD]: "Splat! A mud puddle found Dan!",
    [TEACHER_FEED_KINDS.RACE_FINISHED]: "Finish! The race is over!",
  },
};

describe("the projector feed's rare moments", () => {
  afterEach(() => i18n.changeLanguage("he"));

  it.each(["he", "en"])("tells a Tailwind, a Mud and the race's end with their own line and painting (%s)", async (language) => {
    await i18n.changeLanguage(language);
    const { items, now } = raceWithTheRareMoments();

    render(
      <MantineProvider>
        <TeacherLiveEventsPanel items={items} serverNowEpochMs={now} />
      </MantineProvider>,
    );

    for (const [kind, line] of Object.entries(EXPECTED[language])) {
      const row = screen.getByRole("log").querySelector(`li[data-feed-kind="${kind}"]`);
      expect(row, kind).not.toBeNull();
      expect(row).toHaveTextContent(line);
      expect(row.querySelector("img")).toHaveAttribute("src", TEACHER_FEED_PRESENTATION[kind].art);
    }
    expect(screen.getByRole("log").textContent).not.toContain("{{");
  });
});
