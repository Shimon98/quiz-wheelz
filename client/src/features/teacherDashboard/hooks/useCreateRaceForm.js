import { useState } from "react";
import { CREATE_RACE_DEFAULT_VALUES } from "../config/createRaceFormConfig";
import { buildCreateRacePayload } from "../utils/racePayloadUtils";

function validateCreateRaceForm(values, validationContent) {
    const errors = {};

    if (!values.title.trim()) {
        errors.title = validationContent.titleRequired;
    }

    if (!values.subjectId) {
        errors.subjectId = validationContent.subjectRequired;
    }

    if (!values.maxPlayers) {
        errors.maxPlayers = validationContent.maxPlayersRequired;
    }

    if (!values.totalDistance) {
        errors.totalDistance = validationContent.totalDistanceRequired;
    }

    return errors;
}

export function useCreateRaceForm({ onSubmit, validationContent }) {
    const [values, setValues] = useState(CREATE_RACE_DEFAULT_VALUES);
    const [errors, setErrors] = useState({});

    function updateField(name, value) {
        setValues((currentValues) => ({
            ...currentValues,
            [name]: value,
        }));

        setErrors((currentErrors) => ({
            ...currentErrors,
            [name]: undefined,
        }));
    }

    function handleChange(event) {
        updateField(event.target.name, event.target.value);
    }

    async function handleSubmit(event) {
        event.preventDefault();

        const nextErrors = validateCreateRaceForm(values, validationContent);
        setErrors(nextErrors);

        if (Object.keys(nextErrors).length > 0) {
            return;
        }

        await onSubmit(buildCreateRacePayload(values));
    }

    return {
        values,
        errors,
        handleChange,
        updateField,
        handleSubmit,
    };
}
