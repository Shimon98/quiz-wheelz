import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Box, Button, Group, Paper, Title } from "@mantine/core";

import { I18N_NAMESPACES } from "../../../i18n/i18nConstants";
import { useLanguageStore } from "../../../stores/languageStore";
import { buildRaceViewModel } from "../utils/raceDisplayUtils";
import { RACES_PREVIEW_LIMIT } from "../config/teacherWorkspaceConfig";
import RacePreviewTable from "./RacePreviewTable";
import RacePreviewMobileList from "./RacePreviewMobileList";

/**
 * RacesPreviewSection — a SHORT preview of the latest races (the full list
 * lives on the dedicated races page). Builds the shared view models once and
 * hands them to the desktop table / mobile cards.
 */
export default function RacesPreviewSection({
  races,
  onOpenRace,
  onViewAllRaces,
}) {
  const { t } = useTranslation(I18N_NAMESPACES.TEACHER_WORKSPACE);
  const language = useLanguageStore((state) => state.language);

  const items = useMemo(
    () =>
      races
        .slice(0, RACES_PREVIEW_LIMIT)
        .map((race) => buildRaceViewModel(race, language)),
    [races, language],
  );

  return (
    <Paper radius="xl" p={{ base: "md", sm: "lg" }} withBorder>
      <Group justify="space-between" align="center" mb="md">
        <Title order={3}>{t("races.title")}</Title>

        <Button variant="subtle" size="sm" onClick={onViewAllRaces}>
          {t("actions.viewAllRaces")}
        </Button>
      </Group>

      <Box visibleFrom="md">
        <RacePreviewTable items={items} onOpenRace={onOpenRace} />
      </Box>
      <Box hiddenFrom="md">
        <RacePreviewMobileList items={items} onOpenRace={onOpenRace} />
      </Box>
    </Paper>
  );
}
