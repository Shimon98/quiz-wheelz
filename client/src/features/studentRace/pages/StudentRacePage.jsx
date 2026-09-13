import useRaceBootstrap from "../hooks/useRaceBootstrap";
import useStudentRaceQuestion from "../hooks/useStudentRaceQuestion";
import useStudentRaceAnswer from "../hooks/useStudentRaceAnswer";
import useStudentRaceRecoverySync from "../hooks/useStudentRaceRecoverySync";
import useStudentRaceFinishExperience from "../hooks/useStudentRaceFinishExperience.js";
import { RACE_VIEWS } from "../../../shared/racePlayer/getRaceView";
import RacePlayerSessionGate from "../../../shared/racePlayer/RacePlayerSessionGate";
import useRacePlayerRuntimeSession from "../../../shared/racePlayer/useRacePlayerRuntimeSession";
import { isRacePlayerSessionError } from "../../../errors/errorChecks";
import StudentRaceContent from "../components/StudentRaceContent";
import StudentRaceSessionConnecting from "../components/StudentRaceSessionConnecting";

function ResolvedStudentRacePage({ runtimeSession }) {
  const {
    runtimeState,
    view,
    isLoading,
    error: raceError,
    retry: raceRetry,
    authoritativeResync,
    applyAuthoritativeSnapshot,
    beginAuthoritativeMutation,
    endAuthoritativeMutation,
    isMutationCurrent,
    finishOrder,
    requestFinishArbitration,
  } = useRaceBootstrap({ syncEnabled: runtimeSession.isGameplayConnectionReady,
    finishSyncEnabled: runtimeSession.isPassiveRaceRequestReady });

  const finishExperience = useStudentRaceFinishExperience({ runtimeState, view, finishOrder,
    finishSyncEnabled: runtimeSession.isPassiveRaceRequestReady && !isRacePlayerSessionError(raceError),
    requestFinishArbitration });

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
    isAwaitingNextQuestion,
    isSubmitting,
    selectedChoiceId,
    correctAnswerChoiceId,
    feedbackState,
    answerFeedback,
    answerError,
  } = useStudentRaceAnswer({
    question,
    refreshQuestion,
    applyAuthoritativeSnapshot,
    beginAuthoritativeMutation,
    endAuthoritativeMutation,
    isMutationCurrent,
  });

  useStudentRaceRecoverySync({
    view,
    stopPresence: runtimeSession.stopPresence,
    raceError,
    questionError,
    answerError,
    reconnectNow: runtimeSession.reconnectNow,
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
            keepRaceScreen={finishExperience.keepRaceScreen}
            finishPresentation={finishExperience.presentation}
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
              answerFeedback,
              isSubmitting,
              isAwaitingNextQuestion,
              connectionState: runtimeSession.connectionState,
              connectionError: runtimeSession.error,
              onConnectionRetry: runtimeSession.reconnectNow,
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
