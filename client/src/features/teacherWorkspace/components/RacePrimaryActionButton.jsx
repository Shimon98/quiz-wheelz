import { useTranslation } from "react-i18next";
import { Button } from "@mantine/core";

import { I18N_NAMESPACES } from "../../../i18n/i18nConstants";
import {
  getRacePrimaryAction,
  RACE_ACTION_KINDS,
} from "../config/raceActionsConfig";

export default function RacePrimaryActionButton({ race, onAction }) {
  const { t } = useTranslation(I18N_NAMESPACES.TEACHER_WORKSPACE);
  const action = getRacePrimaryAction(race?.status);

  return (
    <Button
      variant="light"
      size="xs"
      disabled={action.kind === RACE_ACTION_KINDS.NONE}
      onClick={() => onAction(race)}
    >
      {t(action.labelKey)}
    </Button>
  );
}
