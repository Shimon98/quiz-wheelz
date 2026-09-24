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
import useTeacherRaces from "../hooks/useTeacherRaces";
import useTeacherRacePrimaryAction from "../hooks/useTeacherRacePrimaryAction";
import { buildRaceViewModel } from "../utils/raceDisplayUtils";
import RacePreviewTable from "../components/RacePreviewTable";
import RacePreviewMobileList from "../components/RacePreviewMobileList";
import RacePrimaryActionButton from "../components/RacePrimaryActionButton";
import CreateRaceModal from "../components/createRace/CreateRaceModal";
import {
  DashboardEmptyState,
  DashboardErrorState,
} from "../components/DashboardStates";

export default function TeacherRacesPage() {
  const { t } = useTranslation(I18N_NAMESPACES.TEACHER_WORKSPACE);
  const navigate = useNavigate();
  const executeRacePrimaryAction = useTeacherRacePrimaryAction();
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

  const renderRowAction = useCallback(
    (item) => (
      <RacePrimaryActionButton
        race={item.race}
        onAction={executeRacePrimaryAction}
      />
    ),
    [executeRacePrimaryAction],
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
                onOpenRace={executeRacePrimaryAction}
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
