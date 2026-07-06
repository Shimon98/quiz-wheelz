import { STUDENT_RACE_VISUAL_CONFIG } from "../config/raceVisualConfig";

/*
 * Reserved HUD strip (layout contract, G): keeps the top of the world clear
 * for the future score/streak/timer chips (UI-10K). Honest-UI rule: nothing
 * renders here until real server data exists — this is a spacer, not a fake
 * HUD.
 */
export default function StudentRaceHudSafeArea() {
  const { hud } = STUDENT_RACE_VISUAL_CONFIG.layout;

  return (
    <div
      aria-hidden="true"
      style={{
        minHeight: hud.minHeight,
        paddingTop: hud.topInset,
        paddingInlineStart: hud.sideInset,
        paddingInlineEnd: hud.sideInset,
      }}
    />
  );
}
