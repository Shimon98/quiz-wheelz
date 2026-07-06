import { STUDENT_RACE_VISUAL_CONFIG } from "../config/raceVisualConfig";
import PixiStudentRaceCanvas from "../pixi/PixiStudentRaceCanvas";
import StudentRaceOverlay from "./StudentRaceOverlay";

/*
 * The student race screen composition (layout contract, G):
 *
 *   game frame (phone: edge-to-edge; wide screens: centered, gameFrame cap)
 *   └── Pixi canvas — FULL area, absolute, the world continues behind the panel
 *   └── React overlay — HUD safe area on top, persistent question panel below
 *
 * Pure composition: no API, no game data, no question logic — pages/hooks
 * own those in later stages (H/I/J). runtimeState is passed through to the
 * canvas untouched.
 */
export default function StudentRaceScreen({ runtimeState = null }) {
  const { gameFrame } = STUDENT_RACE_VISUAL_CONFIG;

  return (
    <div className="flex h-dvh w-full justify-center bg-[var(--qw-bg)]">
      <div
        className="relative h-full w-full overflow-hidden"
        style={{ maxWidth: gameFrame.maxWidth }}
      >
        <PixiStudentRaceCanvas
          runtimeState={runtimeState}
          className="absolute inset-0"
        />
        <StudentRaceOverlay />
      </div>
    </div>
  );
}
