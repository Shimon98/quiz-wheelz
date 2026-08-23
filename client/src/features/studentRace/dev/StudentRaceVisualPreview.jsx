import { useEffect, useMemo, useState } from "react";

import StudentRaceScreen from "../layout/StudentRaceScreen";
import { createInitialRaceRuntimeState } from "../runtime/createInitialRaceRuntimeState";
import { createLocalStudentRaceRuntime } from "../runtime/localStudentRaceRuntime";
import { mapLocalRuntimeSnapshotToState } from "../runtime/mapLocalRuntimeSnapshotToState";

export default function StudentRaceVisualPreview() {
  const runtime = useMemo(() => createLocalStudentRaceRuntime(), []);
  const [runtimeState, setRuntimeState] = useState(() =>
    mapLocalRuntimeSnapshotToState(
      createInitialRaceRuntimeState(),
      runtime.getSnapshot(),
    ),
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
