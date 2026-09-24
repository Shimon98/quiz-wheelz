import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Box, Button, Group, Paper, Title } from "@mantine/core";

import { I18N_NAMESPACES } from "../../../i18n/i18nConstants";
import { useLanguageStore } from "../../../stores/languageStore";
import { buildRaceViewModel } from "../utils/raceDisplayUtils";
import { RACES_PREVIEW_LIMIT } from "../config/teacherWorkspaceConfig";
import RacePreviewTable from "./RacePreviewTable";
import RacePreviewMobileList from "./RacePreviewMobileList";
import RacePrimaryActionButton from "./RacePrimaryActionButton";

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

  const renderRowAction = useCallback(
    (item) => <RacePrimaryActionButton race={item.race} onAction={onOpenRace} />,
    [onOpenRace],
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
        <RacePreviewTable
          items={items}
          onOpenRace={onOpenRace}
          renderRowAction={renderRowAction}
        />
      </Box>
      <Box hiddenFrom="md">
        <RacePreviewMobileList items={items} renderRowAction={renderRowAction} />
      </Box>
    </Paper>
  );
}
