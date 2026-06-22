import DashboardButton from "../ui/DashboardButton";
import MaxPlayersSelector from "./MaxPlayersSelector";
import RaceLengthSelector from "./RaceLengthSelector";
import SubjectSelect from "./SubjectSelect";
import {useCreateRaceForm} from "../../hooks/useCreateRaceForm";
import {
    CREATE_RACE_FORM_STYLES,
    DASHBOARD_FIELD_STYLES,
    DASHBOARD_TEXT_STYLES,
} from "../../styles/dashboardUiStyles";
import RaceFlagIcon from "../ui/RaceFlagIcon";

export default function CreateRaceForm({
                                           subjects,
                                           isSubmitting,
                                           isLoadingSubjects,
                                           content,
                                           onCancel,
                                           onSubmit,
                                       }) {
    const {values, errors, handleChange, handleSubmit} = useCreateRaceForm({
        onSubmit,
        validationContent: content.validation,
    });

    return (
        <form onSubmit={handleSubmit} className={CREATE_RACE_FORM_STYLES.form}>
            <div className={CREATE_RACE_FORM_STYLES.fieldGrid}>
                <div>
                    <label
                        htmlFor="create-race-title"
                        className={DASHBOARD_TEXT_STYLES.fieldLabel}
                    >
                        {content.fields.title}
                    </label>

                    <input
                        id="create-race-title"
                        name="title"
                        value={values.title}
                        onChange={handleChange}
                        placeholder={content.fields.titlePlaceholder}
                        className={DASHBOARD_FIELD_STYLES.input}
                    />
                    <p className={DASHBOARD_TEXT_STYLES.helperError}>
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

            <div className={CREATE_RACE_FORM_STYLES.actions}>
                <DashboardButton
                    type="button"
                    variant="secondary"
                    size="lg"
                    onClick={onCancel}
                    disabled={isSubmitting}
                    className={CREATE_RACE_FORM_STYLES.cancelButton}
                >
                    {content.buttons.cancel}
                </DashboardButton>

                <DashboardButton
                    type="submit"
                    variant="cta"
                    size="lg"
                    disabled={isSubmitting}
                    className={CREATE_RACE_FORM_STYLES.submitButton}
                >
                    <RaceFlagIcon className={CREATE_RACE_FORM_STYLES.submitIcon}/>
                    <span>{isSubmitting ? content.buttons.submitting : content.buttons.submit}</span>
                </DashboardButton>
            </div>
        </form>
    );
}