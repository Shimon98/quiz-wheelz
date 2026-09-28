import { useTranslation } from "react-i18next";
import { Button } from "@mantine/core";
import { Undo2 } from "lucide-react";

import { I18N_NAMESPACES } from "../../../i18n/i18nConstants";
import { TEACHER_RESULTS_STYLES as S } from "../styles/teacherRaceResultsStyles";

export default function TeacherResultsFooter({ onBackToRaces }) {
  const { t } = useTranslation(I18N_NAMESPACES.TEACHER_RACE_RESULTS);

  return (
    <footer className={S.footer}>
      <div className={S.footerBack}>
        <Button
          variant="light"
          radius="xl"
          leftSection={<Undo2 size={18} aria-hidden="true" />}
          onClick={onBackToRaces}
        >
          {t("footer.backToRaces")}
        </Button>
      </div>
    </footer>
  );
}
