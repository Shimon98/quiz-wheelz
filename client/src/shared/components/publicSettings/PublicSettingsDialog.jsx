import { Modal, Stack, Text } from "@mantine/core";
import { useTranslation } from "react-i18next";
import { I18N_NAMESPACES } from "../../../i18n/i18nConstants";
import LanguageSelector from "./LanguageSelector";
import ThemeModeSelector from "./ThemeModeSelector";

/**
 * PublicSettingsDialog — the public settings modal on Mantine Modal, which owns
 * the overlay, focus trap, Escape/overlay-click closing, and return-focus.
 * Keeps the same `open` / `onClose` contract as before; sections read/write the
 * language and theme stores themselves.
 */
export default function PublicSettingsDialog({ open, onClose }) {
  const { t } = useTranslation(I18N_NAMESPACES.PUBLIC_SETTINGS);

  return (
    <Modal
      opened={open}
      onClose={onClose}
      centered
      radius="lg"
      title={
        <Text component="h2" fw={800} size="lg">
          {t("dialog.title")}
        </Text>
      }
      closeButtonProps={{ "aria-label": t("dialog.closeLabel") }}
    >
      <Stack gap="lg">
        <LanguageSelector />
        <ThemeModeSelector />
      </Stack>
    </Modal>
  );
}
