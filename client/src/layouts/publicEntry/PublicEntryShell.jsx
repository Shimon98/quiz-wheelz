import { Outlet } from "react-router-dom";

import EntryShell from "../../shared/layouts/entryShell/EntryShell";
import { PUBLIC_ENTRY_SHELL_CONFIG } from "./publicEntryShellConfig";

/**
 * PublicEntryShell — the public / auth entry flow's layout route (landing,
 * teacher login / register / forgot password): the shared EntryShell
 * geometry wearing the public identity from publicEntryShellConfig. The
 * chrome renders ONCE; only the routed <Outlet/> content swaps between
 * screens. Adding a screen = one *Content.jsx + one route line — never a
 * new shell.
 */
export default function PublicEntryShell() {
  return (
    <EntryShell config={PUBLIC_ENTRY_SHELL_CONFIG}>
      <Outlet />
    </EntryShell>
  );
}
