import DashboardButton from "../ui/DashboardButton";
import MaxPlayersSelector from "./MaxPlayersSelector";
import RaceLengthSelector from "./RaceLengthSelector";
import SubjectSelect from "./SubjectSelect";
import { useCreateRaceForm } from "../../hooks/useCreateRaceForm";

export default function CreateRaceForm({
    subjects,
    isSubmitting,
    isLoadingSubjects,
    content,
    onCancel,
    onSubmit,
}) {
    const { values, errors, handleChange, handleSubmit } = useCreateRaceForm({
        onSubmit,
        validationContent: content.validation,
    });

    return (
        <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
            <div>
                <label
                    htmlFor="create-race-title"
                    className="text-sm font-extrabold text-slate-700"
                >
                    {content.fields.title}
                </label>

                <input
                    id="create-race-title"
                    name="title"
                    value={values.title}
                    onChange={handleChange}
                    placeholder={content.fields.titlePlaceholder}
                    className="mt-2 min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                />

                <p className="mt-2 min-h-5 text-xs font-bold text-rose-600">
                    {errors.title || "\u00A0"}
                </p>
            </div>

            <SubjectSelect
                id="create-race-subject"
                name="subjectId"
                value={values.subjectId}
                subjects={subjects}
                isLoading={isLoadingSubjects}
                error={errors.subjectId}
                content={content}
                onChange={handleChange}
            />

            <MaxPlayersSelector
                value={values.maxPlayers}
                error={errors.maxPlayers}
                content={content}
                onChange={handleChange}
            />

            <RaceLengthSelector
                value={values.totalDistance}
                error={errors.totalDistance}
                content={content}
                onChange={handleChange}
            />

            <div className="rounded-2xl bg-slate-50 px-4 py-3">
                <span className="block text-xs font-bold text-slate-400">
                    {content.fields.initialMode}
                </span>
                <span className="mt-1 block text-sm font-extrabold text-slate-800">
                    {content.fields.initialModeValue}
                </span>
            </div>

            <div className="mt-2 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <DashboardButton
                    type="button"
                    variant="secondary"
                    onClick={onCancel}
                    disabled={isSubmitting}
                >
                    {content.buttons.cancel}
                </DashboardButton>

                <DashboardButton type="submit" disabled={isSubmitting}>
                    {isSubmitting ? content.buttons.submitting : content.buttons.submit}
                </DashboardButton>
            </div>
        </form>
    );
}
