import useRaceBootstrap from "../hooks/useRaceBootstrap";
import useStudentRaceQuestion from "../hooks/useStudentRaceQuestion";
import useStudentRaceAnswer from "../hooks/useStudentRaceAnswer";
import useStudentRaceRecoverySync from "../hooks/useStudentRaceRecoverySync";
import { RACE_VIEWS } from "../../../shared/racePlayer/getRaceView";
import RacePlayerSessionGate from "../../../shared/racePlayer/RacePlayerSessionGate";
import useRacePlayerRuntimeSession from "../../../shared/racePlayer/useRacePlayerRuntimeSession";
import { isRacePlayerSessionError } from "../../../errors/errorChecks";
import StudentRaceContent from "../components/StudentRaceContent";
import StudentRaceSessionConnecting from "../components/StudentRaceSessionConnecting";

/*
 * StudentRacePage — thin composition: reconnect resolves first (C1-05),
 * only a resolved session mounts the gameplay hooks; one session gate per
 * authoritative source.
 */

function ResolvedStudentRacePage({ runtimeSession }) {
  const {
    runtimeState,
    view,
    isLoading,
    error: raceError,
    retry: raceRetry,
    authoritativeResync,
    applyAuthoritativeSnapshot,
  } = useRaceBootstrap({ syncEnabled: runtimeSession.isGameplayConnectionReady });

  // Degraded connection pauses questions; the re-enable flip refetches.
  const questionEnabled =
    runtimeSession.isGameplayConnectionReady &&
    view === RACE_VIEWS.PLAYING &&
    !isRacePlayerSessionError(raceError);

  const {
    question,
    error: questionError,
    isExpired: questionExpired,
    refreshQuestion,
  } = useStudentRaceQuestion({ enabled: questionEnabled });

  const {
    submitChoice,
    displayedQuestion,
    isFeedbackDwellActive,
    isAwaitingNextQuestion,
    isSubmitting,
    selectedChoiceId,
    correctAnswerChoiceId,
    feedbackState,
    answerError,
  } = useStudentRaceAnswer({
    question,
    refreshQuestion,
    applyAuthoritativeSnapshot,
  });

  useStudentRaceRecoverySync({
    questionError,
    answerError,
    raceRetry,
    resyncToken: runtimeSession.resyncToken,
    authoritativeResync,
  });

  return (
    <RacePlayerSessionGate error={raceError}>
      <RacePlayerSessionGate error={questionError}>
        <RacePlayerSessionGate error={answerError}>
          <StudentRaceContent
            runtimeState={runtimeState}
            view={view}
            isLoading={isLoading}
            error={raceError}
            retry={raceRetry}
            showFinishMoment={
              view === RACE_VIEWS.FINISHED && isFeedbackDwellActive
            }
            questionProps={{
              question: displayedQuestion,
              questionError,
              questionExpired,
              onQuestionRetry: refreshQuestion,
              interactionEnabled:
                view === RACE_VIEWS.PLAYING &&
                runtimeSession.isGameplayConnectionReady,
              onChoiceSelect: submitChoice,
              selectedChoiceId,
              correctAnswerChoiceId,
              feedbackState,
              isSubmitting,
              isAwaitingNextQuestion,
              connectionState: runtimeSession.connectionState,
            }}
          />
        </RacePlayerSessionGate>
      </RacePlayerSessionGate>
    </RacePlayerSessionGate>
  );
}

export default function StudentRacePage() {
  const runtimeSession = useRacePlayerRuntimeSession();

  return (
    <RacePlayerSessionGate error={runtimeSession.error}>
      {runtimeSession.hasResolvedSession ? (
        <ResolvedStudentRacePage runtimeSession={runtimeSession} />
      ) : (
        <StudentRaceSessionConnecting
          connectionState={runtimeSession.connectionState}
          error={runtimeSession.error}
          onReconnect={runtimeSession.reconnectNow}
        />
      )}
    </RacePlayerSessionGate>
  );
}
