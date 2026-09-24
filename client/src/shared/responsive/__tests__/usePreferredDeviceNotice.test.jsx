import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import usePreferredDeviceNotice from "../usePreferredDeviceNotice";
import {
  isViewportPreferred,
  PREFERRED_DEVICE_PROFILES,
} from "../preferredDeviceProfiles";

function setViewport(width, height) {
  Object.defineProperty(window, "innerWidth", { configurable: true, value: width });
  Object.defineProperty(window, "innerHeight", { configurable: true, value: height });
}

beforeEach(() => {
  window.sessionStorage.clear();
});

afterEach(() => {
  setViewport(1024, 768);
});

describe("isViewportPreferred", () => {
  it.each([
    ["teacher on a projector", PREFERRED_DEVICE_PROFILES.TEACHER_LIVE, 1920, 1080, true],
    ["teacher on a portrait tablet", PREFERRED_DEVICE_PROFILES.TEACHER_LIVE, 820, 1180, false],
    ["teacher on a landscape phone", PREFERRED_DEVICE_PROFILES.TEACHER_LIVE, 844, 390, false],
    ["student on a phone", PREFERRED_DEVICE_PROFILES.STUDENT_RACE, 390, 844, true],
    ["student on a landscape phone", PREFERRED_DEVICE_PROFILES.STUDENT_RACE, 844, 390, true],
    ["student on a portrait tablet", PREFERRED_DEVICE_PROFILES.STUDENT_RACE, 820, 1180, false],
    ["student on a landscape tablet", PREFERRED_DEVICE_PROFILES.STUDENT_RACE, 1180, 820, false],
    ["student on a laptop", PREFERRED_DEVICE_PROFILES.STUDENT_RACE, 1366, 768, false],
  ])("evaluates %s", (_label, profile, width, height, expected) => {
    expect(isViewportPreferred(profile, { width, height })).toBe(expected);
  });
});

describe("usePreferredDeviceNotice", () => {
  it("opens for an unsuitable viewport, stays closed for a suitable one and honors enabled", () => {
    setViewport(390, 844);
    const teacher = renderHook(() =>
      usePreferredDeviceNotice({ profile: PREFERRED_DEVICE_PROFILES.TEACHER_LIVE }),
    );
    expect(teacher.result.current.open).toBe(true);

    const disabled = renderHook(() =>
      usePreferredDeviceNotice({ profile: PREFERRED_DEVICE_PROFILES.TEACHER_LIVE, enabled: false }),
    );
    expect(disabled.result.current.open).toBe(false);

    const student = renderHook(() =>
      usePreferredDeviceNotice({ profile: PREFERRED_DEVICE_PROFILES.STUDENT_RACE }),
    );
    expect(student.result.current.open).toBe(false);
  });

  it("remembers a dismissal per profile for the session only", () => {
    setViewport(390, 844);
    const teacher = renderHook(() =>
      usePreferredDeviceNotice({ profile: PREFERRED_DEVICE_PROFILES.TEACHER_LIVE }),
    );

    act(() => teacher.result.current.dismiss());
    expect(teacher.result.current.open).toBe(false);

    const remounted = renderHook(() =>
      usePreferredDeviceNotice({ profile: PREFERRED_DEVICE_PROFILES.TEACHER_LIVE }),
    );
    expect(remounted.result.current.open).toBe(false);

    setViewport(1366, 768);
    const student = renderHook(() =>
      usePreferredDeviceNotice({ profile: PREFERRED_DEVICE_PROFILES.STUDENT_RACE }),
    );
    expect(student.result.current.open).toBe(true);
  });
});
