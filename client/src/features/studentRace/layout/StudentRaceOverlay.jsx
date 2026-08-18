import StudentRaceHudSafeArea from "../components/StudentRaceHudSafeArea";
import StudentRaceQuestionPanel from "../components/StudentRaceQuestionPanel";
import StudentRaceQuestionTimer from "../components/StudentRaceQuestionTimer";

/*
 * The React layer above the Pixi canvas (layout contract, G). The wrapper
 * ignores the pointer so the world underneath stays inert; only interactive
 * children (the question panel) opt back in with pointer-events-auto.
 * Pure distribution — question state arrives from the page via the screen.
 */
export default function StudentRaceOverlay({
  question = null,
  questionError = null,
  questionExpired = false,
  onQuestionRetry = null,
}) {
  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col justify-between">
      <StudentRaceHudSafeArea>
        {question ? (
          <StudentRaceQuestionTimer
            expiresAtEpochMs={question.expiresAtEpochMs}
            serverClockOffsetMs={question.serverClockOffsetMs}
            timeLimitSeconds={question.timeLimitSeconds}
          />
        ) : null}
      </StudentRaceHudSafeArea>
      <StudentRaceQuestionPanel
        question={question}
        error={questionError}
        isExpired={questionExpired}
        onRetry={onQuestionRetry}
      />
    </div>
  );
}
