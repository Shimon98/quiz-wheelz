import { describe, expect, it } from "vitest";

import { compactResultNameList, formatResultNameList } from "../formatResultNameList";

describe("formatResultNameList", () => {
  it("joins tied names with the English conjunction", () => {
    expect(formatResultNameList(["Noa", "Maya"], "en")).toBe("Noa and Maya");
    expect(formatResultNameList(["Noa", "Maya", "Dan"], "en")).toBe("Noa, Maya, and Dan");
  });

  it("joins tied names with the Hebrew conjunction", () => {
    expect(formatResultNameList(["נועה", "מאיה"], "he")).toBe("נועה ומאיה");
  });

  it("returns a single name unchanged", () => {
    expect(formatResultNameList(["Noa"], "en")).toBe("Noa");
  });
});

describe("compactResultNameList", () => {
  it("shows a single recipient in full", () => {
    expect(compactResultNameList(["Noa"], "en", 2)).toEqual({ visibleLabel: "Noa", hiddenCount: 0 });
  });

  it.each([
    ["en", ["Noa", "Maya"], "Noa and Maya"],
    ["he", ["נועה", "מאיה"], "נועה ומאיה"],
  ])("shows two tied recipients in full in %s", (language, names, visibleLabel) => {
    expect(compactResultNameList(names, language, 2)).toEqual({ visibleLabel, hiddenCount: 0 });
  });

  it.each([
    ["en", ["Noa", "Maya", "Dan"], "Noa, Maya"],
    ["he", ["נועה", "מאיה", "דן"], "נועה, מאיה"],
  ])("shows the first two of three tied recipients in %s and counts the third", (language, names, visibleLabel) => {
    expect(compactResultNameList(names, language, 2)).toEqual({ visibleLabel, hiddenCount: 1 });
  });

  it("keeps a large tie bounded and starts from the server order, never a sorted one", () => {
    const names = ["Bot 3", "Bot 1", "Bot 7", "Bot 2", "Bot 5", "Bot 4", "Bot 6"];

    expect(compactResultNameList(names, "en", 2)).toEqual({ visibleLabel: "Bot 3, Bot 1", hiddenCount: 5 });
    expect(names).toEqual(["Bot 3", "Bot 1", "Bot 7", "Bot 2", "Bot 5", "Bot 4", "Bot 6"]);
  });
});
