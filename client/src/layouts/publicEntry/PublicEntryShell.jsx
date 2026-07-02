import { useState } from "react";
import { Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { I18N_NAMESPACES } from "../../i18n/i18nConstants";
import { BrandWordmark } from "../../shared/components/publicEntry";
import ShuffleText from "../../shared/components/publicEntry/ShuffleText";
import bananaMark from "../../assets/brand/quizwheelz-mark.png";
import {
  PublicSettingsButton,
  PublicSettingsDialog,
} from "../../shared/components/publicSettings";
import heroImage from "../../assets/landing/landing-hero-jungle-monkey-kart.png";
import PublicEntryLeaves from "./PublicEntryLeaves";
import { PUBLIC_ENTRY_SHELL_STYLES as S } from "./publicEntryShellStyles";

// Proper noun — identical in every language, so a constant, not an i18n key.
// A SMALL banana mark sits just before the "Q", sized to the text itself
// (h-[1.1em], so it scales with the title font-size); "Wheelz" stays
// brand-green. dir="ltr" keeps the Latin lockup left-to-right (banana →
// QuizWheelz) in both languages. The span's aria-label carries the real word
// for screen readers (the banana + shuffle spans below it are hidden).
const BRAND_TITLE = (
  <span
    dir="ltr"
    className="inline-flex items-center whitespace-nowrap"
    aria-label="QuizWheelz"
  >
    <img
      src={bananaMark}
      alt=""
      aria-hidden="true"
      className="me-1 inline-block h-[1.1em] w-auto shrink-0"
    />
    <ShuffleText
      segments={[
        { text: "Quiz" },
        { text: "Wheelz", className: "text-[var(--qw-primary)]" },
      ]}
    />
  </span>
);

/**
 * PublicEntryShell — the shared outer shell for public / auth entry screens,
 * used as a react-router layout route. It renders the FIXED chrome ONCE — the
 * hero side (image, curved inner edge), the ambient decor + reserved leaf
 * slots, the settings button + dialog, the framed content side, and the
 * QuizWheelz brand — and swaps only the routed <Outlet/> content on navigation
 * (landing today; teacher login / register / forgot password later).
 *
 * The floating card is the BASE card: its surface, brand, settings, hero and
 * decor never re-render between screens — only the values inside <Outlet/> do.
 *
 * Composition mirrors with <html> dir: hero on the left / card on the right in
 * Hebrew (RTL); hero on the right / card on the left in English (LTR), with the
 * hero image -scale-x flipped so it keeps facing the card. No legacy auth
 * layout, no old palettes.
 */
export default function PublicEntryShell() {
  const { t } = useTranslation(I18N_NAMESPACES.PUBLIC_ENTRY);
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <div className={S.page}>
      <div aria-hidden="true" className={S.decorLayer}>
        <span className={S.decorBlobPrimary} />
        <span className={S.decorBlobSecondary} />
      </div>

      <div className={S.stage}>
        <div className={S.frame}>
          <div className={S.settingsOverlay}>
            <PublicSettingsButton
              className="shadow-[var(--qw-shadow-card)]"
              onClick={() => setSettingsOpen(true)}
            />
          </div>

          <div aria-hidden="true" className={S.heroSide}>
            <img src={heroImage} alt="" className={S.heroImage} />
          </div>

          <div className={S.contentSide}>
            <div className={S.floatingCard}>
              <div className={S.cardInner}>
                <div className={S.brand}>
                  <BrandWordmark
                    title={BRAND_TITLE}
                    subtitle={t("landing.tagline")}
                    size="md"
                    titleAs="h1"
                  />
                </div>

                <main className={S.outletHost}>
                  <Outlet />
                </main>
              </div>
              <div aria-hidden="true" className={S.cardLeafLayer}>
                <PublicEntryLeaves variant="card" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div aria-hidden="true" className={S.shellLeafLayer}>
        <PublicEntryLeaves variant="shell" />
      </div>

      {/* footerSlot — reserved for rights / privacy / terms (added later). */}

      <PublicSettingsDialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </div>
  );
}
