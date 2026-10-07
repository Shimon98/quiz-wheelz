import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { MantineProvider } from "@mantine/core";

import i18n from "../../../../i18n/i18n";
import { useAudioSettingsStore } from "../../../../stores/audioSettingsStore";
import AudioSettingsButton from "../AudioSettingsButton";
import AudioSettingsControls from "../AudioSettingsControls";
import PublicSettingsDialog from "../PublicSettingsDialog";

const label = (key) => i18n.t(`publicSettings:audio.${key}`);
const initialLanguage = i18n.language;

// env="test" turns off Mantine transitions and the detached-anchor check, which jsdom (no layout) would trip.
function renderWithMantine(ui) {
  return render(<MantineProvider env="test">{ui}</MantineProvider>);
}

beforeEach(() => {
  useAudioSettingsStore.getState().resetAudioSettings();
});

afterEach(async () => {
  await i18n.changeLanguage(initialLanguage);
});

describe("shared audio settings", () => {
  it("adds the two sound switches to the settings dialog and writes the shared store", () => {
    renderWithMantine(<PublicSettingsDialog open onClose={() => {}} />);

    const music = screen.getByRole("switch", { name: label("music") });
    expect(music).not.toBeChecked();
    expect(screen.getByRole("switch", { name: label("effects") })).toBeChecked();
    fireEvent.click(music);

    expect(useAudioSettingsStore.getState()).toMatchObject({ musicEnabled: true, sfxEnabled: true });
  });

  it("opens the same controls from the compact button, and every copy shares one state", () => {
    renderWithMantine(
      <>
        <AudioSettingsButton />
        <AudioSettingsControls />
      </>,
    );
    const button = screen.getByRole("button", { name: label("buttonLabel") });

    expect(button).toHaveAttribute("aria-haspopup", "dialog");
    fireEvent.click(button);
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("switch", { name: label("effects") }));

    const effects = screen.getAllByRole("switch", { name: label("effects") });
    expect(effects).toHaveLength(2);
    effects.forEach((toggle) => expect(toggle).not.toBeChecked());
    expect(useAudioSettingsStore.getState().sfxEnabled).toBe(false);
  });

  it("shows a change made in Public Settings inside the quick control", () => {
    renderWithMantine(
      <>
        <PublicSettingsDialog open onClose={() => {}} />
        <AudioSettingsButton />
      </>,
    );

    fireEvent.click(screen.getByRole("switch", { name: label("music") }));
    fireEvent.click(screen.getByRole("button", { name: label("buttonLabel") }));

    const music = screen.getAllByRole("switch", { name: label("music") });
    expect(music).toHaveLength(2);
    music.forEach((toggle) => expect(toggle).toBeChecked());
  });

  it("can keep its dropdown inside its own container, as an element in fullscreen requires", () => {
    renderWithMantine(
      <div data-testid="fullscreen-surface">
        <AudioSettingsButton withinPortal={false} />
      </div>,
    );

    fireEvent.click(screen.getByRole("button", { name: label("buttonLabel") }));

    expect(within(screen.getByTestId("fullscreen-surface")).getByRole("dialog")).toBeInTheDocument();
  });

  it("follows the selected language", async () => {
    await i18n.changeLanguage("en");

    renderWithMantine(<AudioSettingsControls />);

    expect(screen.getByRole("heading", { name: "Sound" })).toBeInTheDocument();
    expect(screen.getByRole("switch", { name: "Music" })).toBeInTheDocument();
    expect(screen.getByRole("switch", { name: "Sound effects" })).toBeInTheDocument();
  });
});
