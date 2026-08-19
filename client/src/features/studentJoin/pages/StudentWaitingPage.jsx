import { useState } from "react";

import RacePlayerSessionGate from "../../../shared/racePlayer/RacePlayerSessionGate";
import RacePlayerConnectionNotice from "../../../shared/racePlayer/RacePlayerConnectionNotice";
import useRacePlayerRuntimeSession from "../../../shared/racePlayer/useRacePlayerRuntimeSession";
import useRuntimeSessionResync from "../../../shared/racePlayer/useRuntimeSessionResync";
import useWaitingRace from "../hooks/useWaitingRace";
import { readStoredJoinData } from "../utils/readStoredJoinData";
import StudentWaitingContent from "../components/StudentWaitingContent";
import StudentWaitingConnecting from "../components/StudentWaitingConnecting";

// The waiting race-state flow mounts only after the initial reconnect resolves.
function ResolvedWaiting({ joinData, runtimeSession }) {
  const { raceState, view, isLoading, error, retry, authoritativeResync } =
    useWaitingRace({ syncEnabled: runtimeSession.isGameplayConnectionReady });

  useRuntimeSessionResync(runtimeSession.resyncToken, authoritativeResync);

  return (
    <RacePlayerSessionGate error={error}>
      <RacePlayerConnectionNotice
        connectionState={runtimeSession.connectionState}
        error={runtimeSession.error}
        onRetry={runtimeSession.reconnectNow}
      />
      <StudentWaitingContent
        joinData={joinData}
        raceState={raceState}
        view={view}
        isLoading={isLoading}
        error={error}
        retry={retry}
      />
    </RacePlayerSessionGate>
  );
}

export default function StudentWaitingPage() {
  const [joinData] = useState(readStoredJoinData);
  const runtimeSession = useRacePlayerRuntimeSession();

  return (
    <RacePlayerSessionGate error={runtimeSession.error}>
      {runtimeSession.hasResolvedSession ? (
        <ResolvedWaiting joinData={joinData} runtimeSession={runtimeSession} />
      ) : (
        <StudentWaitingConnecting
          connectionState={runtimeSession.connectionState}
          error={runtimeSession.error}
          onReconnect={runtimeSession.reconnectNow}
        />
      )}
    </RacePlayerSessionGate>
  );
}
