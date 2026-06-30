import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { I18N_NAMESPACES } from "../../../i18n/i18nConstants";
import LanguageSelector from "./LanguageSelector";
import ThemeModeSelector from "./ThemeModeSelector";
import { PUBLIC_SETTINGS_STYLES as S } from "./publicSettingsStyles";

const TITLE_ID = "public-settings-dialog-title";

/**
 * PublicSettingsDialog — native <dialog> settings shell.
 *
 * Open state is driven by the `open` prop through showModal()/close() (not the
 * bare `open` attribute), so we get the top layer, the ::backdrop, focus
 * trapping, and Escape-to-close for free. The native "close" event (fired by
 * Escape, the close button, or close()) is the single path back to the parent,
 * keeping React state and the DOM in sync. Backdrop click closes only when the
 * click lands on the dialog element itself (the dim area), never on content.
 */
export default function PublicSettingsDialog({ open, onClose }) {
  const { t } = useTranslation(I18N_NAMESPACES.PUBLIC_SETTINGS);
  const dialogRef = useRef(null);

  // Reflect the `open` prop onto the native dialog imperatively.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  // One source of truth for closing: the native close event (Escape / close()).
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return undefined;
    }

    const handleClose = () => onClose?.();
    dialog.addEventListener("close", handleClose);
    return () => dialog.removeEventListener("close", handleClose);
  }, [onClose]);

  const handleDialogClick = (event) => {
    // Clicking the backdrop targets the dialog element itself.
    if (event.target === dialogRef.current) {
      dialogRef.current.close();
    }
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={TITLE_ID}
      className={S.dialog}
      onClick={handleDialogClick}
    >
      <div className={S.dialogPanel}>
        <header className={S.dialogHeader}>
          <h2 id={TITLE_ID} className={S.dialogTitle}>
            {t("dialog.title")}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("dialog.closeLabel")}
            className={S.closeButton}
          >
            <X aria-hidden="true" className={S.closeIcon} />
          </button>
        </header>

        <div className={S.sections}>
          <LanguageSelector />
          <ThemeModeSelector />
        </div>
      </div>
    </dialog>
  );
}
