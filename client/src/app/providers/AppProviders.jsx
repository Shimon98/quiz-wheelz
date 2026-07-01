import LanguageProvider from "./LanguageProvider";
import ThemeProvider from "./ThemeProvider";
import MantineUIProvider from "./MantineUIProvider";

/**
 * AppProviders — single composition point for app-wide providers, so main.jsx
 * stays a thin mount and App.jsx stays free of provider logic.
 *
 * Order: LanguageProvider (lang/dir) wraps ThemeProvider (data-theme), which
 * wraps MantineUIProvider (Mantine theme/RTL/modals/notifications). MantineUI
 * reads language + mode from the two stores above so they stay a single source
 * of truth. LanguageProvider/ThemeProvider are side-effect-only.
 */
export default function AppProviders({ children }) {
  return (
    <LanguageProvider>
      <ThemeProvider>
        <MantineUIProvider>{children}</MantineUIProvider>
      </ThemeProvider>
    </LanguageProvider>
  );
}
