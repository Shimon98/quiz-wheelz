import { useCallback, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Container, Grid, Skeleton, Stack } from "@mantine/core";

import { ROUTES } from "../../../constants/routeConstants";
import { useLanguageStore } from "../../../stores/languageStore";
import useTeacherRaceRoom from "../hooks/useTeacherRaceRoom";
import { buildRaceViewModel } from "../utils/raceDisplayUtils";
import RaceRoomHeader from "../components/raceRoom/RaceRoomHeader";
import RoomCodeCard from "../components/raceRoom/RoomCodeCard";
import RacePlayersPanel from "../components/raceRoom/RacePlayersPanel";
import RaceRoomActions from "../components/raceRoom/RaceRoomActions";
import { DashboardErrorState } from "../components/DashboardStates";

/**
 * TeacherRaceRoomPage — the waiting room after creating/opening a race:
 * room code for the classroom board, live-ish RacePlayers list (quiet
 * polling until SSE), and the start action. NOT the game screen — when the
 * live screen ships, start's success will navigate there.
 */
export default function TeacherRaceRoomPage() {
  const { raceId } = useParams();
  const navigate = useNavigate();
  const language = useLanguageStore((state) => state.language);

  const { room, isLoading, error, refetch, startRace, isStarting } =
    useTeacherRaceRoom(raceId);

  const item = useMemo(
    () => (room ? buildRaceViewModel(room, language) : null),
    [room, language],
  );

  const handleBackToRaces = useCallback(() => {
    navigate(ROUTES.TEACHER_RACES);
  }, [navigate]);

  if (isLoading) {
    return (
      <Container size="xl">
        <Stack gap="lg" aria-busy="true">
          <Skeleton height={64} radius="xl" w="50%" />
          <Grid gutter="lg">
            <Grid.Col span={{ base: 12, md: 7 }}>
              <Skeleton height={180} radius="xl" />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 5 }}>
              <Skeleton height={180} radius="xl" />
            </Grid.Col>
          </Grid>
          <Skeleton height={240} radius="xl" />
        </Stack>
      </Container>
    );
  }

  if (error || !room) {
    return (
      <Container size="xl">
        <DashboardErrorState onRetry={refetch} />
      </Container>
    );
  }

  return (
    <Container size="xl">
      <Stack gap="lg">
        <RaceRoomHeader item={item} />

        <Grid gutter="lg">
          <Grid.Col span={{ base: 12, md: 7 }}>
            <RoomCodeCard roomCode={room.roomCode} />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 5 }}>
            <RaceRoomActions
              status={room.status}
              currentPlayers={room.currentPlayers}
              onStartRace={startRace}
              isStarting={isStarting}
              onBackToRaces={handleBackToRaces}
              onRefresh={refetch}
            />
          </Grid.Col>
        </Grid>

        <RacePlayersPanel
          players={room.players ?? room.racePlayers}
          maxPlayers={room.maxPlayers}
        />
      </Stack>
    </Container>
  );
}
