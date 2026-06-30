import LanguageProvider from "./LanguageProvider";
import ThemeProvider from "./ThemeProvider";

/**
 * AppProviders — single composition point for app-wide providers, so main.jsx
 * stays a thin mount and App.jsx stays free of provider logic.
 *
 * Order: LanguageProvider (lang/dir) wraps ThemeProvider (data-theme); both are
 * side-effect-only and render their children.
 */
export default function AppProviders({ children }) {
  return (
    <LanguageProvider>
      <ThemeProvider>{children}</ThemeProvider>
    </LanguageProvider>
  );
}
