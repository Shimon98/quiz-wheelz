import { useEffect, useMemo, useState } from "react";

import StudentRaceScreen from "../layout/StudentRaceScreen";
import { createInitialRaceRuntimeState } from "../runtime/createInitialRaceRuntimeState";
import { createLocalStudentRaceRuntime } from "../runtime/localStudentRaceRuntime";
import { mapLocalRuntimeSnapshotToState } from "../runtime/mapLocalRuntimeSnapshotToState";

/*
 * DEV-ONLY visual preview of the student race world — deliberately NOT
 * wired to AppRouter and never imported by app code, so it ships nowhere.
 *
 * To eyeball the world during development: temporarily add a route that
 * renders this component, look, and REMOVE the route before committing
 * (the temp-route verification flow used since UI-10D). It drives the
 * canvas with the local runtime only — no API calls, no server.
 */
export default function StudentRaceVisualPreview() {
  const runtime = useMemo(() => createLocalStudentRaceRuntime(), []);
  const [runtimeState, setRuntimeState] = useState(
    createInitialRaceRuntimeState,
  );

  useEffect(() => {
    const unsubscribe = runtime.subscribe((snapshot) => {
      setRuntimeState((previous) =>
        mapLocalRuntimeSnapshotToState(previous, snapshot),
      );
    });
    runtime.start();

    return () => {
      runtime.stop();
      unsubscribe();
    };
  }, [runtime]);

  return <StudentRaceScreen runtimeState={runtimeState} />;
}
