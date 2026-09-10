import StudentRaceHud from "../components/StudentRaceHud";
import StudentRaceHudSafeArea from "../components/StudentRaceHudSafeArea";
import StudentRaceQuestionPanel from "../components/StudentRaceQuestionPanel";
import RacePlayerConnectionNotice from "../../../shared/racePlayer/RacePlayerConnectionNotice";

export default function StudentRaceOverlay({
  runtimeState = null,
  connectionState = null,
  connectionError = null,
  onConnectionRetry = null,
  question = null,
  questionError = null,
  questionExpired = false,
  onQuestionRetry = null,
  interactionEnabled = false,
  onChoiceSelect = null,
  selectedChoiceId = null,
  correctAnswerChoiceId = null,
  feedbackState,
  answerFeedback = null,
  isSubmitting = false,
  isAwaitingNextQuestion = false,
}) {
  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col justify-between">
      <div>
        <StudentRaceHudSafeArea>
          <StudentRaceHud runtimeState={runtimeState} question={question} answerFeedback={answerFeedback} />
        </StudentRaceHudSafeArea>
        <RacePlayerConnectionNotice
          connectionState={connectionState}
          error={connectionError}
          onRetry={onConnectionRetry}
        />
      </div>
      <StudentRaceQuestionPanel
        question={question}
        error={questionError}
        isExpired={questionExpired}
        onRetry={onQuestionRetry}
        interactionEnabled={interactionEnabled}
        onChoiceSelect={onChoiceSelect}
        selectedChoiceId={selectedChoiceId}
        correctAnswerChoiceId={correctAnswerChoiceId}
        feedbackState={feedbackState}
        isSubmitting={isSubmitting}
        isAwaitingNextQuestion={isAwaitingNextQuestion}
      />
    </div>
  );
}
