import { useTranslation } from "react-i18next";
import { Button } from "@mantine/core";
import { Plus } from "lucide-react";

import { I18N_NAMESPACES } from "../../../i18n/i18nConstants";

/**
 * DashboardPrimaryAction — the one visually-primary action on the dashboard:
 * create a new race. The click behavior arrives from the page (UI-07 will
 * wire the real creation flow into the same prop).
 */
export default function DashboardPrimaryAction({ onClick }) {
  const { t } = useTranslation(I18N_NAMESPACES.TEACHER_WORKSPACE);

  return (
    <Button
      size="lg"
      radius="xl"
      leftSection={<Plus size={22} aria-hidden="true" />}
      onClick={onClick}
      w={{ base: "100%", sm: "fit-content" }}
      style={{ alignSelf: "flex-start" }}
    >
      {t("actions.createRace")}
    </Button>
  );
}
