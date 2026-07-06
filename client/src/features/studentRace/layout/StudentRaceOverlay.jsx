import StudentRaceHudSafeArea from "../components/StudentRaceHudSafeArea";
import StudentRaceQuestionPanelShell from "../components/StudentRaceQuestionPanelShell";

/*
 * The React layer above the Pixi canvas (layout contract, G). The wrapper
 * ignores the pointer so the world underneath stays inert; only interactive
 * children (the question panel) opt back in with pointer-events-auto.
 */
export default function StudentRaceOverlay() {
  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col justify-between">
      <StudentRaceHudSafeArea />
      <StudentRaceQuestionPanelShell />
    </div>
  );
}
