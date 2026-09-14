import { describe, expect, it } from "vitest";

import {
  requireArray,
  requireFiniteNumber,
  requireNonEmptyString,
  requireObject,
  requireOneOf,
  requireOptionalEpochMs,
  requireSafeInteger,
} from "../apiContractGuards";
import { ApiContractError } from "../ApiContractError";

describe("apiContractGuards", () => {
  it("returns accepted values unchanged", () => {
    const object = { a: 1 };
    const list = [1];

    expect(requireObject(object, "x")).toBe(object);
    expect(requireArray(list, "x", { maxLength: 1 })).toBe(list);
    expect(requireSafeInteger(0, "x", { min: 0 })).toBe(0);
    expect(requireFiniteNumber(-2.5, "x")).toBe(-2.5);
    expect(requireNonEmptyString(" ok ", "x")).toBe(" ok ");
    expect(requireOneOf("A", new Set(["A"]), "x")).toBe("A");
    expect(requireOptionalEpochMs(1_755_600_000_000, "x")).toBe(1_755_600_000_000);
  });

  it("maps null and undefined optional epochs to null", () => {
    expect(requireOptionalEpochMs(null, "x")).toBeNull();
    expect(requireOptionalEpochMs(undefined, "x")).toBeNull();
  });

  it.each([
    ["array as object", () => requireObject([], "x")],
    ["null object", () => requireObject(null, "x")],
    ["array above max length", () => requireArray([1, 2], "x", { maxLength: 1 })],
    ["non-array", () => requireArray("[]", "x")],
    ["fractional integer", () => requireSafeInteger(1.5, "x")],
    ["integer below min", () => requireSafeInteger(0, "x", { min: 1 })],
    ["integer above max", () => requireSafeInteger(9, "x", { max: 8 })],
    ["unsafe integer", () => requireSafeInteger(Number.MAX_SAFE_INTEGER + 1, "x")],
    ["NaN number", () => requireFiniteNumber(Number.NaN, "x")],
    ["number below min", () => requireFiniteNumber(-1, "x", { min: 0 })],
    ["blank string", () => requireNonEmptyString("  ", "x")],
    ["non-string", () => requireNonEmptyString(5, "x")],
    ["value outside set", () => requireOneOf("B", new Set(["A"]), "x")],
    ["zero epoch", () => requireOptionalEpochMs(0, "x")],
    ["string epoch", () => requireOptionalEpochMs("1", "x")],
  ])("rejects %s with ApiContractError", (_label, call) => {
    expect(call).toThrow(ApiContractError);
  });
});
