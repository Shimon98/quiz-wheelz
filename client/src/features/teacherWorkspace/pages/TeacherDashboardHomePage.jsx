import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useDisclosure } from "@mantine/hooks";

import {
  ROUTES,
  buildTeacherRaceRoomPath,
} from "../../../constants/routeConstants";
import { useAuthStore } from "../../../stores/authStore";
import useTeacherDashboardHome from "../hooks/useTeacherDashboardHome";
import CreateRaceModal from "../components/createRace/CreateRaceModal";
import TeacherDashboardHomeView from "./TeacherDashboardHomeView";

/**
 * TeacherDashboardHomePage — connects the data hook + app stores to the pure
 * view. All behavior lives here; the view only renders.
 */
export default function TeacherDashboardHomePage() {
  const navigate = useNavigate();

  const { teacherName, races, stats, isLoading, error, refetch } =
    useTeacherDashboardHome();

  const user = useAuthStore((state) => state.user);

  const [
    isCreateRaceOpen,
    { open: openCreateRace, close: closeCreateRace },
  ] = useDisclosure(false);

  const handleOpenRace = useCallback(
    (race) => {
      navigate(buildTeacherRaceRoomPath(race.raceId ?? race.id));
    },
    [navigate],
  );

  const handleViewAllRaces = useCallback(() => {
    navigate(ROUTES.TEACHER_RACES);
  }, [navigate]);

  // After a successful creation the teacher heads straight to the race's
  // waiting room (Shimon's call in the UI-07 plan); the dashboard refresh
  // still runs so Back shows fresh data.
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
        onOpenRace={handleOpenRace}
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
