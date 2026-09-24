import { describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { MantineProvider } from "@mantine/core";

import PreferredDeviceNotice from "../PreferredDeviceNotice";

const TITLE = "Best on a large screen";
const BODY = "Open the live race on a projector or a laptop.";
const CONFIRM = "Got it";
const UNDERLYING = "Underlying action";

describe("PreferredDeviceNotice", () => {
  it("advises without blocking: not modal, no focus trap, no scroll lock and the page underneath stays usable", async () => {
    const onDismiss = vi.fn();
    const onUnderlyingAction = vi.fn();

    render(
      <MantineProvider>
        <button type="button" onClick={onUnderlyingAction}>
          {UNDERLYING}
        </button>
        <PreferredDeviceNotice
          open
          title={TITLE}
          body={BODY}
          confirmLabel={CONFIRM}
          onDismiss={onDismiss}
        />
      </MantineProvider>,
    );
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    const notice = screen.getByRole("dialog", { name: TITLE });
    expect(notice).toHaveAttribute("aria-modal", "false");
    expect(notice).toHaveAccessibleDescription(BODY);
    expect(notice.contains(document.activeElement)).toBe(false);
    expect(document.body).not.toHaveAttribute("data-scroll-locked");

    const underlying = screen.getByRole("button", { name: UNDERLYING });
    underlying.focus();
    fireEvent.click(underlying);
    expect(document.activeElement).toBe(underlying);
    expect(onUnderlyingAction).toHaveBeenCalledTimes(1);

    fireEvent.click(within(notice).getByRole("button", { name: CONFIRM }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("sits below a workspace header so it never covers the navigation burger", () => {
    render(
      <MantineProvider>
        <PreferredDeviceNotice open title={TITLE} body={BODY} confirmLabel={CONFIRM} onDismiss={() => {}} />
      </MantineProvider>,
    );

    const affix = screen.getByRole("dialog").closest(".mantine-Affix-root");
    expect(affix.style.getPropertyValue("--affix-top")).toContain("--app-shell-header-offset");
  });
});
