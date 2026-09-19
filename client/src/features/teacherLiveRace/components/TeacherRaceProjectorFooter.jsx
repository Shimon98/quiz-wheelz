import { useTranslation } from "react-i18next";
import { Button, ThemeIcon } from "@mantine/core";
import { Undo2 } from "lucide-react";

import { I18N_NAMESPACES } from "../../../i18n/i18nConstants";
import BrandLockup from "../../../shared/components/brand/BrandLockup";
import { TEACHER_CONNECTION_PRESENTATION } from "../config/teacherRaceLiveConfig";
import { TEACHER_PROJECTOR_STYLES as S } from "../styles/teacherRaceProjectorStyles";

export default function TeacherRaceProjectorFooter({
  connectionState,
  onBackToRaces,
}) {
  const { t } = useTranslation(I18N_NAMESPACES.TEACHER_LIVE_RACE);
  const connection = TEACHER_CONNECTION_PRESENTATION[connectionState];
  const ConnectionIcon = connection?.icon;

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

      <BrandLockup className={S.footerBrand} />

      {connection ? (
        <div className={S.footerConnection} role="status">
          <ThemeIcon variant="light" color={connection.tone} size="md" radius="xl">
            <ConnectionIcon size={16} aria-hidden="true" />
          </ThemeIcon>
          <span>{t(connection.labelKey)}</span>
        </div>
      ) : null}
    </footer>
  );
}
