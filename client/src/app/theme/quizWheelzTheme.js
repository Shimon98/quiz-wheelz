import { createTheme } from "@mantine/core";

/**
 * QuizWheelz Mantine theme — the single source of truth for generic UI styling.
 *
 * The `dark` scale mirrors the app's C-03 dark tokens (styles/themes.css —
 * deep navy, NOT Mantine's default near-black grays), so every Mantine
 * component (Paper, Modal, inputs...) lands on the SAME surfaces as the
 * custom-token UI in dark mode. Index meaning in Mantine: 0 = lightest text,
 * 4 = borders, 6 = surfaces, 7 = body background, 9 = darkest.
 */
export const quizWheelzTheme = createTheme({
  primaryColor: "green",
  primaryShade: { light: 6, dark: 8 },
  defaultRadius: "lg",
  cursorType: "pointer",
  colors: {
    dark: [
      "#EAF2F8", // 0 — strong text        (= --qw-text dark)
      "#9DB2C2", // 1 — muted text         (= --qw-text-muted dark)
      "#7E97A9", // 2
      "#567286", // 3 — disabled / placeholder
      "#24455C", // 4 — borders            (= --qw-border dark)
      "#1E4257", // 5 — hover surface
      "#16344A", // 6 — inputs/soft        (= --qw-surface-alt dark)
      "#112B3D", // 7 — Paper/Modal surface (= --qw-surface dark; Mantine
      //                 Paper reads dark.7 in dark mode — verified live)
      "#0A1D2E", // 8 — deep background    (= --qw-navy-deep)
      "#061422", // 9 — darkest
    ],
  },
});

/*
 * Mantine palette NAMES for props like <Alert color=...> and
 * notifications.show({ color }). One place to change a tone app-wide —
 * components must not hardcode "green"/"red"/"gray" strings.
 */
export const UI_TONES = Object.freeze({
  SUCCESS: "green",
  DANGER: "red",
  NEUTRAL: "gray",
  WARNING: "yellow",
  INFO: "blue",
});
