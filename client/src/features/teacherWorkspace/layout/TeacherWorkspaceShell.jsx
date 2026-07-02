import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AppShell, Burger, Group } from "@mantine/core";
import { useDisclosure, useMediaQuery } from "@mantine/hooks";

import { I18N_NAMESPACES } from "../../../i18n/i18nConstants";
import { PublicSettingsDialog } from "../../../shared/components/publicSettings";
import BrandLockup from "../../../shared/components/brand/BrandLockup";
import TeacherWorkspaceNavbar from "./TeacherWorkspaceNavbar";
import {
  WORKSPACE_MOBILE_BREAKPOINT,
  WORKSPACE_MOBILE_HEADER_HEIGHT,
  WORKSPACE_NAVBAR_WIDTH,
} from "../config/teacherWorkspaceConfig";

/**
 * TeacherWorkspaceShell — the page chrome for every teacher-area screen:
 * fixed sidebar on desktop, burger + full-width collapsing navbar on mobile
 * (Mantine AppShell mobile mode — the desktop sidebar is not squeezed, it
 * becomes an overlay). Owns the navigation behavior for navbar items and the
 * settings dialog (language/theme — reusing the shared public settings, one
 * settings UI app-wide).
 */
export default function TeacherWorkspaceShell({
  activeNavId,
  teacherName,
  onLogout,
  isLoggingOut,
  children,
}) {
  const { t } = useTranslation(I18N_NAMESPACES.TEACHER_WORKSPACE);
  const navigate = useNavigate();
  const [navOpened, { toggle: toggleNav, close: closeNav }] = useDisclosure();
  const [settingsOpen, setSettingsOpen] = useState(false);

  // The mobile header row disappears entirely on desktop (the sidebar brand
  // takes over) — `collapsed` also removes its offset from AppShell.Main.
  const isDesktop = useMediaQuery("(min-width: 48em)", false);

  function handleItemSelect(item) {
    closeNav();

    if (item.action === "settings") {
      setSettingsOpen(true);
      return;
    }

    if (item.route) {
      navigate(item.route);
    }
  }

  return (
    <AppShell
      padding="lg"
      header={{
        height: WORKSPACE_MOBILE_HEADER_HEIGHT,
        collapsed: isDesktop,
      }}
      navbar={{
        width: WORKSPACE_NAVBAR_WIDTH,
        breakpoint: WORKSPACE_MOBILE_BREAKPOINT,
        collapsed: { mobile: !navOpened },
      }}
    >
      <AppShell.Header>
        {/* Burger sits on the side the navbar slides in from (inline-start),
            brand on the opposite side. */}
        <Group h="100%" px="md" justify="space-between" wrap="nowrap">
          <Burger
            opened={navOpened}
            onClick={toggleNav}
            hiddenFrom={WORKSPACE_MOBILE_BREAKPOINT}
            size="sm"
            aria-label={t("nav.menu")}
          />
          <BrandLockup className="text-lg font-extrabold" />
        </Group>
      </AppShell.Header>

      <AppShell.Navbar>
        <TeacherWorkspaceNavbar
          activeId={activeNavId}
          teacherName={teacherName}
          onItemSelect={handleItemSelect}
          onLogout={onLogout}
          isLoggingOut={isLoggingOut}
        />
      </AppShell.Navbar>

      <AppShell.Main
        style={{
          background:
            "light-dark(var(--mantine-color-gray-0), var(--mantine-color-dark-8))",
        }}
      >
        {children}
      </AppShell.Main>

      <PublicSettingsDialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </AppShell>
  );
}
