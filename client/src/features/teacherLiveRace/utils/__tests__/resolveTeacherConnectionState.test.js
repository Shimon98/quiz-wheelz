import { expect, it } from "vitest";

import { resolveTeacherConnectionState } from "../resolveTeacherConnectionState";
import {
  TEACHER_CONNECTION_STATES,
  TEACHER_STREAM_STATUSES,
} from "../../runtime/teacherRaceLiveConstants";

const running = { race: { status: "IN_PROGRESS" } };
const finished = { race: { status: "FINISHED" } };
const base = { runtime: running, error: null, isOnline: true, recovery: null, streamStatus: TEACHER_STREAM_STATUSES.OPEN };

it.each([
  ["error wins", { error: { category: "SERVER" } }, TEACHER_CONNECTION_STATES.ERROR],
  ["offline", { isOnline: false }, TEACHER_CONNECTION_STATES.OFFLINE],
  ["finished race", { runtime: finished, streamStatus: TEACHER_STREAM_STATUSES.IDLE }, TEACHER_CONNECTION_STATES.ENDED],
  ["recovery pending", { recovery: { reason: "VERSION_GAP" } }, TEACHER_CONNECTION_STATES.RECOVERING],
  ["native reconnect", { streamStatus: TEACHER_STREAM_STATUSES.RETRYING }, TEACHER_CONNECTION_STATES.RECOVERING],
  ["open stream", {}, TEACHER_CONNECTION_STATES.LIVE],
  ["opening stream", { streamStatus: TEACHER_STREAM_STATUSES.OPENING }, TEACHER_CONNECTION_STATES.CONNECTING],
  ["before the first load", { runtime: null, streamStatus: TEACHER_STREAM_STATUSES.IDLE }, TEACHER_CONNECTION_STATES.CONNECTING],
])("resolves %s", (_label, overrides, expected) => {
  expect(resolveTeacherConnectionState({ ...base, ...overrides })).toBe(expected);
});
