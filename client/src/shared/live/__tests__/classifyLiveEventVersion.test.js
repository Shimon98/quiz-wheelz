import { expect, it } from "vitest";

import {
  classifyLiveEventVersion,
  LIVE_EVENT_VERSION_RELATIONS,
} from "../classifyLiveEventVersion";

it.each([
  [10, 9, LIVE_EVENT_VERSION_RELATIONS.STALE],
  [10, 10, LIVE_EVENT_VERSION_RELATIONS.STALE],
  [10, 11, LIVE_EVENT_VERSION_RELATIONS.NEXT],
  [10, 12, LIVE_EVENT_VERSION_RELATIONS.GAP],
  [0, 1, LIVE_EVENT_VERSION_RELATIONS.NEXT],
  [0, 5, LIVE_EVENT_VERSION_RELATIONS.GAP],
])("classifies current %i with incoming %i as %s", (current, incoming, relation) => {
  expect(classifyLiveEventVersion(current, incoming)).toBe(relation);
});
