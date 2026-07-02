import { Box, Container, Stack } from "@mantine/core";

import TeacherWorkspaceShell from "../layout/TeacherWorkspaceShell";
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
 * everything arrives via props, no data fetching, no stores (except the
 * display-level ones inside sections). This is what makes the page trivially
 * previewable and testable.
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
  onLogout,
  isLoggingOut,
}) {
  const hasRaces = races.length > 0;

  return (
    <TeacherWorkspaceShell
      activeNavId="dashboard"
      teacherName={teacherName}
      onLogout={onLogout}
      isLoggingOut={isLoggingOut}
    >
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
                <RacesPreviewSection races={races} onOpenRace={onOpenRace} />
              ) : (
                <DashboardEmptyState onCreateRace={onCreateRace} />
              )}
            </>
          )}
        </Stack>
      </Container>
    </TeacherWorkspaceShell>
  );
}
