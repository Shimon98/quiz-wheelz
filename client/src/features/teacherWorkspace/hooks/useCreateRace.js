import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { getSubjects } from "../../../api/subjectApi";
import { createTeacherRace } from "../../../api/teacherApi";
import { I18N_NAMESPACES } from "../../../i18n/i18nConstants";
import {
  showApiErrorNotification,
  showSuccessNotification,
} from "../../../shared/notifications/appNotifications";
import { buildCreateRacePayload } from "../utils/createRacePayload";

const EMPTY_SUBJECTS = Object.freeze([]);

/**
 * useCreateRace — all create-race logic, so the modal/form stay display-only:
 * loads subjects when the modal mounts, submits the mapped payload, and
 * routes outcomes through the app notification/error foundation. On success
 * calls onCreated(race) — navigation is the page's business.
 */
export default function useCreateRace({ onCreated }) {
  const { t } = useTranslation(I18N_NAMESPACES.TEACHER_WORKSPACE);

  const [subjects, setSubjects] = useState(EMPTY_SUBJECTS);
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(true);
  const [subjectsFailed, setSubjectsFailed] = useState(false);
  const [subjectsReloadToken, setSubjectsReloadToken] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function reloadSubjects() {
    setIsLoadingSubjects(true);
    setSubjectsFailed(false);
    setSubjectsReloadToken((token) => token + 1);
  }

  useEffect(() => {
    let isActive = true;

    async function loadSubjects() {
      try {
        const subjectsResponse = await getSubjects();

        if (isActive) {
          setSubjects(
            Array.isArray(subjectsResponse) ? subjectsResponse : EMPTY_SUBJECTS,
          );
        }
      } catch (requestError) {
        if (isActive) {
          setSubjectsFailed(true);
          showApiErrorNotification(requestError, {
            id: "subjects-load-failed",
            fallbackKey: "teacher.subjectsLoadFailed",
          });
        }
      } finally {
        if (isActive) {
          setIsLoadingSubjects(false);
        }
      }
    }

    loadSubjects();

    return () => {
      isActive = false;
    };
  }, [subjectsReloadToken]);

  async function submitRace(formValues) {
    setIsSubmitting(true);

    try {
      const createdRace = await createTeacherRace(
        buildCreateRacePayload(formValues),
      );

      showSuccessNotification({
        title: t("createRace.successTitle"),
        message: createdRace?.roomCode
          ? t("createRace.successBody", { roomCode: createdRace.roomCode })
          : undefined,
      });

      onCreated?.(createdRace);
    } catch (requestError) {
      showApiErrorNotification(requestError, {
        fallbackKey: "teacher.createRaceFailed",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return {
    subjects,
    isLoadingSubjects,
    subjectsFailed,
    reloadSubjects,
    submitRace,
    isSubmitting,
  };
}
