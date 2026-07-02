import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { notifications } from "@mantine/notifications";

import { I18N_NAMESPACES } from "../../../i18n/i18nConstants";
import { UI_TONES } from "../../../app/theme/quizWheelzTheme";
import {
  ROUTES,
  buildTeacherRaceRoomPath,
} from "../../../constants/routeConstants";
import { useAuthStore } from "../../../stores/authStore";
import useTeacherDashboardHome from "../hooks/useTeacherDashboardHome";
import TeacherDashboardHomeView from "./TeacherDashboardHomeView";

/**
 * TeacherDashboardHomePage — connects the data hook + app stores to the pure
 * view. All behavior lives here; the view only renders.
 */
export default function TeacherDashboardHomePage() {
  const navigate = useNavigate();
  const { t } = useTranslation(I18N_NAMESPACES.TEACHER_WORKSPACE);

  const { teacherName, races, stats, isLoading, error, refetch } =
    useTeacherDashboardHome();

  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const isLoggingOut = useAuthStore((state) => state.isLoading);

  const handleLogout = useCallback(async () => {
    await logout();
    navigate(ROUTES.LANDING, { replace: true });
  }, [logout, navigate]);

  const handleOpenRace = useCallback(
    (race) => {
      navigate(buildTeacherRaceRoomPath(race.id));
    },
    [navigate],
  );

  // ponytail: the real create-race flow ships in UI-07 — until then the
  // primary action is an honest "coming soon" toast, not a fake modal.
  const handleCreateRace = useCallback(() => {
    notifications.show({
      title: t("actions.createRaceSoonTitle"),
      message: t("actions.createRaceSoonBody"),
      color: UI_TONES.SUCCESS,
    });
  }, [t]);

  return (
    <TeacherDashboardHomeView
      teacherName={teacherName ?? user?.displayName ?? null}
      stats={stats}
      races={races}
      isLoading={isLoading}
      error={error}
      onRetry={refetch}
      onCreateRace={handleCreateRace}
      onOpenRace={handleOpenRace}
      onLogout={handleLogout}
      isLoggingOut={isLoggingOut}
    />
  );
}
