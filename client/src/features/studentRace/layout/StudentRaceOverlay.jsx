import StudentRaceChallengePanel from "../components/StudentRaceChallengePanel";
import StudentRaceHud from "../components/StudentRaceHud";
import StudentRaceHudSafeArea from "../components/StudentRaceHudSafeArea";
import StudentRaceQuestionPanel from "../components/StudentRaceQuestionPanel";
import RacePlayerConnectionNotice from "../../../shared/racePlayer/RacePlayerConnectionNotice";
import { hasChallengeTimeoutSlowdown } from "../runtime/studentRaceGameplayMode";

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
  challenge = null,
  hudControls = null,
}) {
  const showChallenge = challenge?.visible === true;

  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col justify-between">
      <div>
        <StudentRaceHudSafeArea>
          <StudentRaceHud
            runtimeState={runtimeState}
            question={showChallenge ? null : question}
            challengeOffer={showChallenge ? challenge.offer : null}
            answerFeedback={answerFeedback}
            controls={hudControls}
          />
        </StudentRaceHudSafeArea>
        <RacePlayerConnectionNotice
          connectionState={connectionState}
          error={connectionError}
          onRetry={onConnectionRetry}
        />
      </div>
      {showChallenge ? (
        <StudentRaceChallengePanel
          offer={challenge.offer}
          phase={challenge.phase}
          selectedChoice={challenge.selectedChoice}
          openChoices={challenge.openChoices}
          isExpired={challenge.isExpired}
          interactionEnabled={interactionEnabled}
          onChoose={challenge.onChoose}
          onResync={challenge.onResync}
        />
      ) : (
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
          slowdownNotice={hasChallengeTimeoutSlowdown(runtimeState?.gameplay)}
        />
      )}
    </div>
  );
}
