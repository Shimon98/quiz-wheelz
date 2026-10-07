import { Outlet } from "react-router-dom";

import { useSceneMusic } from "../../../shared/audio";
import { GAME_AUDIO } from "../../../shared/gameAudio/gameAudioCatalog";
import EntryShell from "../../../shared/layouts/entryShell/EntryShell";
import { STUDENT_GAME_MUSIC_GAIN } from "../config/studentJoinConfig";
import { STUDENT_ENTRY_SHELL_CONFIG } from "./studentShellConfig";

/**
 * StudentShell — the student flow's layout route: the shared EntryShell
 * geometry (full-bleed hero + card, settings, decor — the teacher-entry
 * look) wearing the student identity from studentShellConfig. Renders once;
 * only the routed <Outlet/> content swaps, and the hero art follows the
 * route (join scene / waiting scene) via the config map.
 */
export default function StudentShell() {
  useSceneMusic(GAME_AUDIO.MUSIC_GAME, STUDENT_GAME_MUSIC_GAIN);
  return (
    <EntryShell config={STUDENT_ENTRY_SHELL_CONFIG}>
      <Outlet />
    </EntryShell>
  );
}
