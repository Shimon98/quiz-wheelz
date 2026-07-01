import { useEffect, useState } from "react";
import { DirectionProvider, MantineProvider } from "@mantine/core";
import { ModalsProvider } from "@mantine/modals";
import { Notifications } from "@mantine/notifications";
import { useLanguageStore } from "../../stores/languageStore";
import { getLanguageDirection } from "../../utils/languageDirectionUtils";
import { useThemeStore, THEME_MODES } from "../../stores/themeStore";
import { quizWheelzTheme } from "../theme/quizWheelzTheme";

const DARK_QUERY = "(prefers-color-scheme: dark)";

function systemScheme() {
  if (typeof window === "undefined" || !window.matchMedia) {
    return "light";
  }
  return window.matchMedia(DARK_QUERY).matches ? "dark" : "light";
}

/**
 * Bridges the existing themeStore (light/dark/system) to Mantine's color scheme
 * so the current ThemeModeSelector stays the single toggle — Mantine follows it
 * via forceColorScheme instead of managing its own separate state.
 */
function useResolvedColorScheme() {
  const mode = useThemeStore((state) => state.mode);
  const [system, setSystem] = useState(systemScheme);

  useEffect(() => {
    if (mode !== THEME_MODES.SYSTEM || typeof window === "undefined" || !window.matchMedia) {
      return undefined;
    }
    const mq = window.matchMedia(DARK_QUERY);
    const onChange = () => setSystem(mq.matches ? "dark" : "light");
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [mode]);

  if (mode === THEME_MODES.LIGHT || mode === THEME_MODES.DARK) {
    return mode;
  }
  return system;
}

/**
 * MantineUIProvider — wires Mantine (theme, RTL direction, modals, notifications)
 * as the app-wide UI system. Sits inside LanguageProvider/ThemeProvider so it can
 * mirror their language (direction) and mode (color scheme).
 */
export default function MantineUIProvider({ children }) {
  const language = useLanguageStore((state) => state.language);
  const direction = getLanguageDirection(language);
  const colorScheme = useResolvedColorScheme();

  return (
    <DirectionProvider key={direction} initialDirection={direction}>
      <MantineProvider theme={quizWheelzTheme} forceColorScheme={colorScheme}>
        <ModalsProvider>
          <Notifications position="top-center" />
          {children}
        </ModalsProvider>
      </MantineProvider>
    </DirectionProvider>
  );
}
