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
        <form onSubmit={handleSubmit} className="mt-5 grid gap-4">
            <div className="grid gap-4 md:grid-cols-2">
                <div>
                    <label
                        htmlFor="create-race-title"
                        className="text-sm font-extrabold text-slate-800"
                    >
                        {content.fields.title}
                    </label>

                    <input
                        id="create-race-title"
                        name="title"
                        value={values.title}
                        onChange={handleChange}
                        placeholder={content.fields.titlePlaceholder}
                        className="mt-2 min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 shadow-[0_4px_14px_rgba(15,23,42,0.06)] outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-4 focus:ring-sky-100"                    />

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
            </div>

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

            <div className="mt-1 flex items-center justify-between gap-3">
                <DashboardButton
                    type="button"
                    variant="secondary"
                    onClick={onCancel}
                    disabled={isSubmitting}
                    className="min-w-32"
                >
                    {content.buttons.cancel}
                </DashboardButton>

                <DashboardButton
                    type="submit"
                    disabled={isSubmitting}
                    className="min-w-56 bg-gradient-to-l from-blue-700 to-sky-500 text-base shadow-[0_10px_24px_rgba(2,132,199,0.28)] hover:from-blue-800 hover:to-sky-600"
                >
                    {isSubmitting ? content.buttons.submitting : content.buttons.submit}
                    <span className="ms-2">🏁</span>
                </DashboardButton>
            </div>
        </form>
    );
}