import LanguageProvider from "./LanguageProvider";
import ThemeProvider from "./ThemeProvider";
import MantineUIProvider from "./MantineUIProvider";
import AudioProvider from "./AudioProvider";

/**
 * AppProviders — single composition point for app-wide providers, so main.jsx
 * stays a thin mount and App.jsx stays free of provider logic.
 *
 * Order: LanguageProvider (lang/dir) wraps ThemeProvider (data-theme), which
 * wraps MantineUIProvider (Mantine theme/RTL/modals/notifications). MantineUI
 * reads language + mode from the two stores above so they stay a single source
 * of truth. LanguageProvider/ThemeProvider/AudioProvider are side-effect-only.
 * AudioProvider (the one owner of the audio engine's app wiring) stays outside
 * MantineUIProvider, whose direction key remounts its subtree on a language change.
 */
export default function AppProviders({ children }) {
  return (
    <LanguageProvider>
      <ThemeProvider>
        <AudioProvider>
          <MantineUIProvider>{children}</MantineUIProvider>
        </AudioProvider>
      </ThemeProvider>
    </LanguageProvider>
  );
}
