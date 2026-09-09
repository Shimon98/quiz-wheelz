import { useTranslation } from "react-i18next";

import { I18N_NAMESPACES } from "../../../i18n/i18nConstants";
import StudentRaceScreen from "../layout/StudentRaceScreen";
import { useStudentRaceVisualPreview } from "./useStudentRaceVisualPreview";

export default function StudentRaceVisualPreview() {
  const { t } = useTranslation(I18N_NAMESPACES.STUDENT_RACE);
  const preview = useStudentRaceVisualPreview(t);
  return <StudentRaceScreen {...preview} />;
}
