import { STUDENT_RACE_VISUAL_CONFIG } from "../config/raceVisualConfig";

/*
 * HUD strip (layout contract, G): the top-of-world safe area. C1-02 placed
 * the question timer here — its final C1-04 position — so the HUD layout
 * grows around it ([SCORE] [TIMER] [STREAK]) without a second timer. With no
 * children it remains the honest empty spacer.
 */
export default function StudentRaceHudSafeArea({ children = null }) {
  const { hud } = STUDENT_RACE_VISUAL_CONFIG.layout;

  return (
    <div
      aria-hidden={children ? undefined : "true"}
      style={{
        minHeight: hud.minHeight,
        paddingTop: hud.topInset,
        paddingInlineStart: hud.sideInset,
        paddingInlineEnd: hud.sideInset,
      }}
    >
      {children}
    </div>
  );
}
