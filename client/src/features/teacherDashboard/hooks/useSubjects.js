import { useCallback, useEffect, useState } from "react";
import { getSubjects } from "../../../api/subjectApi";

const EMPTY_SUBJECTS = Object.freeze([]);

export function useSubjects() {
    const [subjects, setSubjects] = useState(EMPTY_SUBJECTS);
    const [isLoadingSubjects, setIsLoadingSubjects] = useState(false);
    const [subjectsError, setSubjectsError] = useState(null);

    const reloadSubjects = useCallback(async () => {
        setIsLoadingSubjects(true);
        setSubjectsError(null);

        try {
            const subjectResponse = await getSubjects();
            const nextSubjects = Array.isArray(subjectResponse)
                ? subjectResponse
                : EMPTY_SUBJECTS;

            setSubjects(nextSubjects);

            return nextSubjects;
        } catch (requestError) {
            setSubjectsError(requestError);
            throw requestError;
        } finally {
            setIsLoadingSubjects(false);
        }
    }, []);

    useEffect(() => {
        queueMicrotask(() => {
            reloadSubjects().catch(() => {});
        });
    }, [reloadSubjects]);

    return {
        subjects,
        isLoadingSubjects,
        subjectsError,
        reloadSubjects,
    };
}
