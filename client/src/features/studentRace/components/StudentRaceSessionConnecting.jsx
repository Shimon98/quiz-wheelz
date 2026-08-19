import RacePlayerConnectionNotice from "../../../shared/racePlayer/RacePlayerConnectionNotice";
import StudentRaceStatusView from "./StudentRaceStatusView";
import { STUDENT_RACE_STATUSES } from "./studentRaceStatusConfig";

export default function StudentRaceSessionConnecting({
  connectionState,
  error,
  onReconnect,
}) {
  if (error) {
    return (
      <StudentRaceStatusView
        status={STUDENT_RACE_STATUSES.ERROR}
        error={error}
        onRetry={onReconnect}
      />
    );
  }

  return (
    <div className="relative">
      <StudentRaceStatusView status={STUDENT_RACE_STATUSES.LOADING} />
      <div className="absolute inset-x-0 top-4">
        <RacePlayerConnectionNotice connectionState={connectionState} />
      </div>
    </div>
  );
}
