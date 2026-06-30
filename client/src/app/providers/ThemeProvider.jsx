import { useLayoutEffect } from "react";
import { useThemeStore, THEME_MODES } from "../../stores/themeStore";

const DARK_MEDIA_QUERY = "(prefers-color-scheme: dark)";

function resolveTheme(mode) {
  if (mode === THEME_MODES.LIGHT || mode === THEME_MODES.DARK) {
    return mode;
  }

  if (typeof window === "undefined" || !window.matchMedia) {
    return THEME_MODES.LIGHT;
  }

  return window.matchMedia(DARK_MEDIA_QUERY).matches
    ? THEME_MODES.DARK
    : THEME_MODES.LIGHT;
}

/**
 * Applies the active theme to <html> as data attributes:
 *   data-theme      -> resolved "light" | "dark" (what styles react to)
 *   data-theme-mode -> raw "light" | "dark" | "system" (the user's choice)
 *
 * Renders children only. All theme side effects live here, never in App.jsx.
 */
export default function ThemeProvider({ children }) {
  const mode = useThemeStore((state) => state.mode);

  useLayoutEffect(() => {
    if (typeof document === "undefined") {
      return undefined;
    }

    const root = document.documentElement;

    const applyTheme = () => {
      root.dataset.theme = resolveTheme(mode);
      root.dataset.themeMode = mode;
    };

    applyTheme();

    // Only follow OS changes while the user is on "system".
    if (
      mode !== THEME_MODES.SYSTEM ||
      typeof window === "undefined" ||
      !window.matchMedia
    ) {
      return undefined;
    }

    const mediaQuery = window.matchMedia(DARK_MEDIA_QUERY);
    mediaQuery.addEventListener("change", applyTheme);

    return () => {
      mediaQuery.removeEventListener("change", applyTheme);
    };
  }, [mode]);

  return children;
}
