import { useCallback, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AppShell, Burger, Group, useMantineTheme } from "@mantine/core";
import { useDisclosure, useMediaQuery } from "@mantine/hooks";

import { I18N_NAMESPACES } from "../../../i18n/i18nConstants";
import { ROUTES } from "../../../constants/routeConstants";
import { useAuthStore } from "../../../stores/authStore";
import { PublicSettingsDialog } from "../../../shared/components/publicSettings";
import BrandLockup from "../../../shared/components/brand/BrandLockup";
import TeacherWorkspaceNavbar from "./TeacherWorkspaceNavbar";
import {
  WORKSPACE_MOBILE_HEADER_HEIGHT,
  WORKSPACE_NAVBAR_WIDTH,
} from "../config/teacherWorkspaceConfig";
import { resolveWorkspaceNavBreakpoint } from "../utils/resolveWorkspaceNavBreakpoint";

export default function TeacherWorkspaceShell() {
  const { t } = useTranslation(I18N_NAMESPACES.TEACHER_WORKSPACE);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [navOpened, { toggle: toggleNav, close: closeNav }] = useDisclosure();
  const [settingsOpen, setSettingsOpen] = useState(false);

  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const isLoggingOut = useAuthStore((state) => state.isLoading);

  const theme = useMantineTheme();
  const navBreakpoint = resolveWorkspaceNavBreakpoint(pathname);
  const isDesktop = useMediaQuery(
    `(min-width: ${theme.breakpoints[navBreakpoint]})`,
    false,
  );

  const activeNavId = pathname.startsWith(ROUTES.TEACHER_RACES)
    ? "races"
    : "dashboard";

  const handleLogout = useCallback(async () => {
    await logout();
    navigate(ROUTES.LANDING, { replace: true });
  }, [logout, navigate]);

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
        breakpoint: navBreakpoint,
        collapsed: { mobile: !navOpened },
      }}
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between" wrap="nowrap">
          <Burger
            opened={navOpened}
            onClick={toggleNav}
            hiddenFrom={navBreakpoint}
            size="sm"
            aria-label={t("nav.menu")}
          />
          <BrandLockup className="text-lg font-extrabold" />
        </Group>
      </AppShell.Header>

      <AppShell.Navbar>
        <TeacherWorkspaceNavbar
          activeId={activeNavId}
          teacherName={user?.displayName ?? null}
          onItemSelect={handleItemSelect}
          onLogout={handleLogout}
          isLoggingOut={isLoggingOut}
        />
      </AppShell.Navbar>

      <AppShell.Main
        style={{
          background:
            "light-dark(var(--mantine-color-gray-0), var(--mantine-color-dark-8))",
        }}
      >
        <Outlet />
      </AppShell.Main>

      <PublicSettingsDialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </AppShell>
  );
}
