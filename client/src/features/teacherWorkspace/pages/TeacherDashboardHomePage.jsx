import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useDisclosure } from "@mantine/hooks";

import {
  ROUTES,
  buildTeacherRaceRoomPath,
} from "../../../constants/routeConstants";
import { useAuthStore } from "../../../stores/authStore";
import useTeacherDashboardHome from "../hooks/useTeacherDashboardHome";
import useTeacherRacePrimaryAction from "../hooks/useTeacherRacePrimaryAction";
import CreateRaceModal from "../components/createRace/CreateRaceModal";
import TeacherDashboardHomeView from "./TeacherDashboardHomeView";

export default function TeacherDashboardHomePage() {
  const navigate = useNavigate();
  const executeRacePrimaryAction = useTeacherRacePrimaryAction();

  const { teacherName, races, stats, isLoading, error, refetch } =
    useTeacherDashboardHome();

  const user = useAuthStore((state) => state.user);

  const [
    isCreateRaceOpen,
    { open: openCreateRace, close: closeCreateRace },
  ] = useDisclosure(false);

  const handleViewAllRaces = useCallback(() => {
    navigate(ROUTES.TEACHER_RACES);
  }, [navigate]);

  const handleRaceCreated = useCallback(
    (createdRace) => {
      closeCreateRace();
      refetch();

      const createdRaceId = createdRace?.raceId ?? createdRace?.id;
      if (createdRaceId != null) {
        navigate(buildTeacherRaceRoomPath(createdRaceId));
      }
    },
    [closeCreateRace, refetch, navigate],
  );

  return (
    <>
      <TeacherDashboardHomeView
        teacherName={teacherName ?? user?.displayName ?? null}
        stats={stats}
        races={races}
        isLoading={isLoading}
        error={error}
        onRetry={refetch}
        onCreateRace={openCreateRace}
        onOpenRace={executeRacePrimaryAction}
        onViewAllRaces={handleViewAllRaces}
      />

      <CreateRaceModal
        opened={isCreateRaceOpen}
        onClose={closeCreateRace}
        onCreated={handleRaceCreated}
      />
    </>
  );
}
