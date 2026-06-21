import { useLanguageStore } from "../../../../stores/languageStore";
import { getSubjectDisplayName } from "../../utils/subjectDisplayUtils";

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
            <label htmlFor={id} className="text-sm font-extrabold text-slate-700">
                {content.fields.subject}
            </label>

            <select
                id={id}
                name={name}
                value={value}
                onChange={onChange}
                disabled={isLoading || !hasSubjects}
                className="mt-2 min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 shadow-[0_4px_14px_rgba(15,23,42,0.06)] outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"            >
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
                <p className="mt-2 text-xs font-bold text-slate-500">
                    {content.states.noSubjects}
                </p>
            )}

            <p className="mt-2 min-h-5 text-xs font-bold text-rose-600">
                {error || "\u00A0"}
            </p>
        </div>
    );
}
