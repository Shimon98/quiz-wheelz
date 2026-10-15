import { STUDENT_RACE_VISUAL_CONFIG } from "../config/raceVisualConfig";
import "../styles/studentRaceGameplay.css";

export default function StudentRacePanelSurface({ gameplay = null, children }) {
  const { questionPanel } = STUDENT_RACE_VISUAL_CONFIG.layout;

  return (
    <div
      className="pointer-events-auto w-full"
      style={{
        height: `clamp(${questionPanel.minHeight}px, ${
          questionPanel.heightRatio * 100
        }dvh, ${questionPanel.maxHeight}px)`,
        paddingInlineStart: questionPanel.sideInset,
        paddingInlineEnd: questionPanel.sideInset,
      }}
    >
      <div
        className="race-panel-surface flex h-full w-full flex-col gap-3 rounded-t-[1.75rem] bg-[var(--qw-surface)] p-5"
        data-gameplay={gameplay ?? undefined}
      >
        {children}
      </div>
    </div>
  );
}
