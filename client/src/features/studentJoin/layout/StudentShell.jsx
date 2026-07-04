import { useState } from "react";
import { Outlet } from "react-router-dom";

import BrandLockup from "../../../shared/components/brand/BrandLockup";
import {
  PublicSettingsButton,
  PublicSettingsDialog,
} from "../../../shared/components/publicSettings";
// Reused as-is from the public entry shell — same jungle foliage, same
// reduced-motion behavior; the layer containers here own placement/visibility.
import PublicEntryLeaves from "../../../layouts/publicEntry/PublicEntryLeaves";
import monkeyImage from "../../../assets/landing/landing-role-student-monkey.png";
import { STUDENT_SHELL_STYLES as S } from "./studentShellStyles";

/**
 * StudentShell — the shared chrome of the student flow (join + waiting),
 * wired as a pathless LAYOUT ROUTE. Everything fixed renders ONCE — the
 * jungle background + decor, the brand, the settings button + dialog, the
 * mascot hero and the card surface — and only the routed <Outlet/> content
 * swaps between pages.
 *
 * Phone/tablet: logo → mascot → card in a centered column, faint leaves
 * grounded at the page bottom. Desktop (1200px+): mascot and card side by
 * side, edge foliage filling the open space. The row direction follows the
 * <html> dir, so Hebrew/English mirror the whole composition.
 */
export default function StudentShell() {
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <div className={S.page}>
      <div aria-hidden="true" className={S.decorLayer}>
        <span className={S.decorBlobPrimary} />
        <span className={S.decorBlobSecondary} />
      </div>

      <div aria-hidden="true" className={S.mobileLeafLayer}>
        <PublicEntryLeaves variant="card" />
      </div>
      <div aria-hidden="true" className={S.desktopLeafLayer}>
        <PublicEntryLeaves variant="shell" />
      </div>

      <div className={S.settingsOverlay}>
        <PublicSettingsButton
          className="shadow-[var(--qw-shadow-card)]"
          onClick={() => setSettingsOpen(true)}
        />
      </div>

      <div className={S.stage}>
        <header className={S.brandBar}>
          <BrandLockup className="text-3xl font-extrabold" />
        </header>

        <div className={S.composition}>
          <div aria-hidden="true" className={S.heroSide}>
            <span className={S.heroHalo} />
            <img
              src={monkeyImage}
              alt=""
              draggable="false"
              className={S.heroImage}
            />
          </div>

          <main className={S.card}>
            <Outlet />
          </main>
        </div>
      </div>

      <PublicSettingsDialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </div>
  );
}
