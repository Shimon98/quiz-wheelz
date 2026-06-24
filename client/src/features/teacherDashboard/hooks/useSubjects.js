import { useCallback, useEffect, useState } from "react";
import { getSubjects } from "../../../api/subjectApi";

const EMPTY_SUBJECTS = Object.freeze([]);

function normalizeSubjects(subjectResponse) {
    return Array.isArray(subjectResponse)
        ? subjectResponse
        : EMPTY_SUBJECTS;
}

export function useSubjects() {
    const [subjects, setSubjects] = useState(EMPTY_SUBJECTS);
    const [isLoadingSubjects, setIsLoadingSubjects] = useState(false);
    const [subjectsError, setSubjectsError] = useState(null);

    const reloadSubjects = useCallback(async () => {
        setIsLoadingSubjects(true);
        setSubjectsError(null);

        try {
            const subjectResponse = await getSubjects();
            const nextSubjects = normalizeSubjects(subjectResponse);

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
        let isActive = true;

        async function loadSubjects() {
            setIsLoadingSubjects(true);
            setSubjectsError(null);

            try {
                const subjectResponse = await getSubjects();
                const nextSubjects = normalizeSubjects(subjectResponse);

                if (isActive) {
                    setSubjects(nextSubjects);
                }
            } catch (requestError) {
                if (isActive) {
                    setSubjectsError(requestError);
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
    }, []);

    return {
        subjects,
        isLoadingSubjects,
        subjectsError,
        reloadSubjects,
    };
}