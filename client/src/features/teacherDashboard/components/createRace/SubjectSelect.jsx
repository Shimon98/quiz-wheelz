import {useLanguageStore} from "../../../../stores/languageStore";
import {getSubjectDisplayName} from "../../utils/subjectDisplayUtils";
import {
    DASHBOARD_FIELD_STYLES,
    DASHBOARD_TEXT_STYLES,
} from "../../styles/dashboardUiStyles";

export default function SubjectSelect({
                                          id,
                                          name,
                                          value,
                                          subjects,
                                          isLoading,
                                          error,
                                          content,
                                          onChange,
                                      }) {
    const hasSubjects = subjects.length > 0;
    const language = useLanguageStore((state) => state.language);

    return (
        <div>
            <label htmlFor={id} className={DASHBOARD_TEXT_STYLES.fieldLabel}>
                {content.fields.subject}
            </label>

            <select
                id={id}
                name={name}
                value={value}
                onChange={onChange}
                disabled={isLoading || !hasSubjects}
                className={DASHBOARD_FIELD_STYLES.select}
            >
                <option value="">
                    {isLoading
                        ? content.states.loadingSubjects
                        : content.fields.subjectPlaceholder}
                </option>

                {subjects.map((subject) => {
                    const subjectId = subject.subjectId ?? subject.id;
                    const subjectLabel = getSubjectDisplayName(subject, language);

                    return (
                        <option key={subjectId} value={subjectId}>
                            {subjectLabel}
                        </option>
                    );
                })}
            </select>

            {!isLoading && !hasSubjects && (
                <p className={DASHBOARD_TEXT_STYLES.muted}>
                    {content.states.noSubjects}
                </p>
            )}

            <p className={DASHBOARD_TEXT_STYLES.helperError}>
                {error || "\u00A0"}
            </p>
        </div>
    );
}
