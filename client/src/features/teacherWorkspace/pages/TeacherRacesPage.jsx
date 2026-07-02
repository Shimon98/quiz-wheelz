import { useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Box,
  Button,
  Container,
  Group,
  Paper,
  Skeleton,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { Plus } from "lucide-react";

import { I18N_NAMESPACES } from "../../../i18n/i18nConstants";
import { buildTeacherRaceRoomPath } from "../../../constants/routeConstants";
import { useLanguageStore } from "../../../stores/languageStore";
import { showInfoNotification } from "../../../shared/notifications/appNotifications";
import useTeacherRaces from "../hooks/useTeacherRaces";
import { buildRaceViewModel } from "../utils/raceDisplayUtils";
import { getRacePrimaryAction } from "../config/raceActionsConfig";
import RacePreviewTable from "../components/RacePreviewTable";
import RacePreviewMobileList from "../components/RacePreviewMobileList";
import CreateRaceModal from "../components/createRace/CreateRaceModal";
import {
  DashboardEmptyState,
  DashboardErrorState,
} from "../components/DashboardStates";

/**
 * TeacherRacesPage — the full race-management page (/teacher/races), reached
 * from the navbar and from the dashboard's "view all races". Reuses the SAME
 * table/cards/badges as the dashboard preview and the SAME CreateRaceModal
 * from UI-07 — only the row action differs (status-driven, via
 * raceActionsConfig).
 */
export default function TeacherRacesPage() {
  const { t } = useTranslation(I18N_NAMESPACES.TEACHER_WORKSPACE);
  const navigate = useNavigate();
  const language = useLanguageStore((state) => state.language);

  const { races, isLoading, error, refetch } = useTeacherRaces();

  const [
    isCreateRaceOpen,
    { open: openCreateRace, close: closeCreateRace },
  ] = useDisclosure(false);

  const items = useMemo(
    () => races.map((race) => buildRaceViewModel(race, language)),
    [races, language],
  );

  const handlePrimaryAction = useCallback(
    (race) => {
      const action = getRacePrimaryAction(race?.status);

      if (action.kind === "room") {
        navigate(buildTeacherRaceRoomPath(race.raceId ?? race.id));
        return;
      }

      if (action.kind === "liveSoon") {
        showInfoNotification({ message: t("racesPage.liveSoon") });
        return;
      }

      if (action.kind === "summarySoon") {
        showInfoNotification({ message: t("racesPage.summarySoon") });
      }
    },
    [navigate, t],
  );

  const renderRowAction = useCallback(
    (item) => {
      const action = getRacePrimaryAction(item.status);

      return (
        <Button
          variant="light"
          size="xs"
          disabled={action.kind === "none"}
          onClick={() => handlePrimaryAction(item.race)}
        >
          {t(action.labelKey)}
        </Button>
      );
    },
    [handlePrimaryAction, t],
  );

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
    <Container size="xl">
      <Stack gap="lg">
        <Group justify="space-between" align="flex-end" wrap="wrap">
          <Stack gap={2}>
            <Title order={1} fz={{ base: 26, sm: 32 }}>
              {t("racesPage.title")}
            </Title>
            <Text c="dimmed">{t("racesPage.subtitle")}</Text>
          </Stack>

          <Button
            radius="xl"
            leftSection={<Plus size={18} aria-hidden="true" />}
            onClick={openCreateRace}
          >
            {t("actions.createRace")}
          </Button>
        </Group>

        {isLoading ? (
          <Skeleton height={320} radius="xl" />
        ) : error ? (
          <DashboardErrorState onRetry={refetch} />
        ) : items.length === 0 ? (
          <DashboardEmptyState onCreateRace={openCreateRace} />
        ) : (
          <Paper radius="xl" p={{ base: "md", sm: "lg" }} withBorder>
            <Box visibleFrom="md">
              <RacePreviewTable
                items={items}
                onOpenRace={handlePrimaryAction}
                renderRowAction={renderRowAction}
              />
            </Box>
            <Box hiddenFrom="md">
              <RacePreviewMobileList
                items={items}
                renderRowAction={renderRowAction}
              />
            </Box>
          </Paper>
        )}
      </Stack>

      <CreateRaceModal
        opened={isCreateRaceOpen}
        onClose={closeCreateRace}
        onCreated={handleRaceCreated}
      />
    </Container>
  );
}
