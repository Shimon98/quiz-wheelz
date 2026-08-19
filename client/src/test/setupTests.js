import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

// Tests import describe/it/expect from "vitest" explicitly (no globals), so
// React Testing Library's automatic cleanup never registers — do it here.
afterEach(cleanup);

// jsdom implements no matchMedia; Mantine's color-scheme manager requires it.
if (typeof window.matchMedia !== "function") {
  window.matchMedia = (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  });
}
