import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import useStudentRaceModeCatchUp from "../useStudentRaceModeCatchUp";

const question = (overrides = {}) => ({ id: 41, gameplayContext: "NORMAL", serverTimeEpochMs: 20_000, ...overrides });
const runtime = (mode, lastSnapshotAtEpochMs = 19_000) => ({ lastSnapshotAtEpochMs, gameplay: { mode } });

function mount(props, read = vi.fn().mockResolvedValue("current")) {
  const hook = renderHook((current) => useStudentRaceModeCatchUp(current), {
    initialProps: { enabled: true, readAuthoritativeRaceState: read, ...props },
  });
  const update = (next) => hook.rerender({ enabled: true, readAuthoritativeRaceState: read, ...next });
  return { read, update };
}

describe("useStudentRaceModeCatchUp", () => {
  it("reads the race state once when a question newer than the snapshot belongs to another mode", () => {
    const { read, update } = mount({ question: question(), runtimeState: runtime("TURBO_TRIAL") });
    update({ question: question(), runtimeState: runtime("TURBO_TRIAL") });

    expect(read).toHaveBeenCalledTimes(1);
  });

  it("reads again for the next question that still does not match", () => {
    const { read, update } = mount({ question: question(), runtimeState: runtime("SAFE_RUN") });
    update({ question: question({ id: 42, serverTimeEpochMs: 21_000 }), runtimeState: runtime("SAFE_RUN") });

    expect(read).toHaveBeenCalledTimes(2);
  });

  it("leaves a question older than the snapshot to the question refresh", () => {
    const { read } = mount({ question: question({ serverTimeEpochMs: 18_000 }), runtimeState: runtime("TURBO_TRIAL") });

    expect(read).not.toHaveBeenCalled();
  });

  it.each([
    ["the question matches the mode", { question: question(), runtimeState: runtime("NORMAL") }],
    ["the snapshot is a challenge choice", { question: question(), runtimeState: runtime("CHALLENGE_CHOICE") }],
    ["there is no question", { question: null, runtimeState: runtime("TURBO_TRIAL") }],
    ["gameplay is not active", { enabled: false, question: question(), runtimeState: runtime("TURBO_TRIAL") }],
  ])("reads nothing when %s", (_, props) => {
    const { read } = mount(props);

    expect(read).not.toHaveBeenCalled();
  });

  it("lets a failed read go, since the regular poll still brings the mode", async () => {
    const read = vi.fn().mockRejectedValue(new Error("offline"));
    mount({ question: question(), runtimeState: runtime("TURBO_TRIAL") }, read);

    await Promise.resolve();
    expect(read).toHaveBeenCalledTimes(1);
  });
});
