import { Outlet } from "react-router-dom";

import EntryShell from "../../../shared/layouts/entryShell/EntryShell";
import { STUDENT_ENTRY_SHELL_CONFIG } from "./studentShellConfig";

/**
 * StudentShell — the student flow's layout route: the shared EntryShell
 * geometry (full-bleed hero + card, settings, decor — the teacher-entry
 * look) wearing the student identity from studentShellConfig. Renders once;
 * only the routed <Outlet/> content swaps, and the hero art follows the
 * route (join scene / waiting scene) via the config map.
 */
export default function StudentShell() {
  return (
    <EntryShell config={STUDENT_ENTRY_SHELL_CONFIG}>
      <Outlet />
    </EntryShell>
  );
}
