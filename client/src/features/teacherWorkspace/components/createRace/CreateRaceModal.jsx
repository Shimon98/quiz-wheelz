import { useTranslation } from "react-i18next";
import { Modal } from "@mantine/core";

import { I18N_NAMESPACES } from "../../../../i18n/i18nConstants";
import useCreateRace from "../../hooks/useCreateRace";
import CreateRaceForm from "./CreateRaceForm";

/**
 * CreateRaceModal — the create-race dialog. Mounts its logic (subjects load)
 * only while open thanks to Modal's lazy mounting; success bubbles the
 * created race up via onCreated (the page decides where to navigate).
 */
export default function CreateRaceModal({ opened, onClose, onCreated }) {
  const { t } = useTranslation(I18N_NAMESPACES.TEACHER_WORKSPACE);

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={t("createRace.title")}
      centered
      radius="lg"
      size="md"
    >
      {opened && (
        <CreateRaceModalBody onClose={onClose} onCreated={onCreated} />
      )}
    </Modal>
  );
}

// Separate body so useCreateRace mounts fresh per open (subjects reload,
// clean form state) without any manual reset bookkeeping.
function CreateRaceModalBody({ onClose, onCreated }) {
  const {
    subjects,
    isLoadingSubjects,
    subjectsFailed,
    reloadSubjects,
    submitRace,
    isSubmitting,
  } = useCreateRace({ onCreated });

  return (
    <CreateRaceForm
      subjects={subjects}
      isLoadingSubjects={isLoadingSubjects}
      subjectsFailed={subjectsFailed}
      onReloadSubjects={reloadSubjects}
      onSubmit={submitRace}
      onCancel={onClose}
      isSubmitting={isSubmitting}
    />
  );
}
