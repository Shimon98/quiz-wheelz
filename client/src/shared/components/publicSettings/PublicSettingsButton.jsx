import { Settings } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cx } from "../../../utils/classNameUtils";
import { I18N_NAMESPACES } from "../../../i18n/i18nConstants";
import { PUBLIC_SETTINGS_STYLES as S } from "./publicSettingsStyles";

/**
 * PublicSettingsButton — the gear trigger for the public settings dialog.
 * Real <button>, 44px touch target, accessible name from i18n, decorative
 * icon. Owns no dialog state; the parent passes `onClick`.
 */
export default function PublicSettingsButton({ onClick, className = "" }) {
  const { t } = useTranslation(I18N_NAMESPACES.PUBLIC_SETTINGS);

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={t("button.ariaLabel")}
      className={cx(S.button, className)}
    >
      <Settings aria-hidden="true" className={S.buttonIcon} />
    </button>
  );
}
