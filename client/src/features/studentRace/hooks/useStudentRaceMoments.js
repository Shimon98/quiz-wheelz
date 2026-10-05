import { useEffect, useRef } from "react";

import { deriveStudentRaceMoments } from "../runtime/deriveStudentRaceMoments";

export default function useStudentRaceMoments(presentationRuntime, consumers) {
  const observationRef = useRef(null);
  const sequenceRef = useRef(0);

  useEffect(() => {
    const { observed, moments } = deriveStudentRaceMoments(observationRef.current, presentationRuntime);
    observationRef.current = observed;
    if (moments.length === 0) return;
    sequenceRef.current += 1;
    const batch = Object.freeze({ id: sequenceRef.current, moments: Object.freeze(moments) });
    consumers.forEach((consume) => {
      try {
        consume(batch);
      } catch {
        // A failing consumer must not break the race screen or the other consumers.
      }
    });
  }, [presentationRuntime, consumers]);
}
