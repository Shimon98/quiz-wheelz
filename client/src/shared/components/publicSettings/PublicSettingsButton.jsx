import { ActionIcon } from "@mantine/core";
import { Settings } from "lucide-react";
import { useTranslation } from "react-i18next";
import { I18N_NAMESPACES } from "../../../i18n/i18nConstants";

/**
 * PublicSettingsButton — the gear trigger for the public settings dialog.
 * Mantine ActionIcon (variant/size/radius from the theme), accessible name
 * from i18n, decorative icon. Owns no dialog state; the parent passes onClick.
 */
export default function PublicSettingsButton({ onClick, className = "" }) {
  const { t } = useTranslation(I18N_NAMESPACES.PUBLIC_SETTINGS);

  return (
    <ActionIcon
      variant="default"
      size={44}
      radius="xl"
      onClick={onClick}
      aria-label={t("button.ariaLabel")}
      className={className}
    >
      <Settings aria-hidden="true" size={22} />
    </ActionIcon>
  );
}
