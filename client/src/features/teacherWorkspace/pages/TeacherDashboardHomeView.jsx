import { Box, Container, Stack } from "@mantine/core";

import TeacherGreetingSection from "../components/TeacherGreetingSection";
import DashboardPrimaryAction from "../components/DashboardPrimaryAction";
import DashboardStatsGrid from "../components/DashboardStatsGrid";
import RacesPreviewSection from "../components/RacesPreviewSection";
import {
  DashboardEmptyState,
  DashboardErrorState,
  DashboardLoadingState,
} from "../components/DashboardStates";

/**
 * TeacherDashboardHomeView — the pure composition of the dashboard home:
 * everything arrives via props, no data fetching. The workspace shell is NOT
 * rendered here — it's the layout route around all teacher pages, so it
 * never re-mounts on navigation.
 */
export default function TeacherDashboardHomeView({
  teacherName,
  stats,
  races,
  isLoading,
  error,
  onRetry,
  onCreateRace,
  onOpenRace,
  onViewAllRaces,
}) {
  const hasRaces = races.length > 0;

  return (
    <Container size="xl">
      <Stack gap="xl">
        <TeacherGreetingSection
          name={teacherName}
          action={
            !isLoading && !error && hasRaces ? (
              <DashboardPrimaryAction onClick={onCreateRace} />
            ) : null
          }
        />

        {!isLoading && !error && hasRaces && (
          <Box hiddenFrom="sm">
            <DashboardPrimaryAction onClick={onCreateRace} />
          </Box>
        )}

        {isLoading ? (
          <DashboardLoadingState />
        ) : error ? (
          <DashboardErrorState onRetry={onRetry} />
        ) : (
          <>
            <DashboardStatsGrid stats={stats} />
            {hasRaces ? (
              <RacesPreviewSection
                races={races}
                onOpenRace={onOpenRace}
                onViewAllRaces={onViewAllRaces}
              />
            ) : (
              <DashboardEmptyState onCreateRace={onCreateRace} />
            )}
          </>
        )}
      </Stack>
    </Container>
  );
}
