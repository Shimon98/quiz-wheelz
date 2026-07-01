import { createTheme } from "@mantine/core";

/**
 * QuizWheelz Mantine theme — the single source of truth for generic UI styling.
 *
 * ponytail: starts on Mantine's built-in palettes (green primary = jungle) so
 * we don't hand-roll 10-shade color scales that risk looking off. Swap in a
 * custom "jungle" scale here later only if the defaults actually fall short —
 * nothing else in the app needs to change.
 */
export const quizWheelzTheme = createTheme({
  primaryColor: "green",
  primaryShade: { light: 6, dark: 8 },
  defaultRadius: "lg",
  cursorType: "pointer",
});
