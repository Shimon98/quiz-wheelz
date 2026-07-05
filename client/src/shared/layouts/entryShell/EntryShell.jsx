import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { I18N_NAMESPACES } from "../../../i18n/i18nConstants";
import { cx } from "../../../utils/classNameUtils";
import BrandWordmark from "../../components/publicEntry/BrandWordmark";
import BrandLockup from "../../components/brand/BrandLockup";
import {
  PublicSettingsButton,
  PublicSettingsDialog,
} from "../../components/publicSettings";
import JungleCornerPlants from "../../components/decor/JungleCornerPlants";
import { PLANT_PLACEMENTS } from "../../components/decor/jungleCornerPlantsConfig";
import {
  ENTRY_SHELL_STYLES as S,
  ENTRY_SHELL_CARD_WIDTHS,
} from "./entryShellStyles";

// Proper noun — identical in every language, so a constant, not an i18n key.
const BRAND_TITLE = <BrandLockup />;

// The phone in-card decor is always the ground strip at the sheet floor;
// flows only choose how faded it is (config.cardStripOpacity).
const CARD_STRIP_PLACEMENTS = [PLANT_PLACEMENTS.GROUND_STRIP];

/**
 * EntryShell — THE shared entry-screen shell: the full-bleed hero + card
 * geometry proven on the public entry screens, now serving any entry-style
 * flow. Each flow wraps it as a layout route with its own config:
 *
 *   <EntryShell config={flowConfig}><Outlet /></EntryShell>
 *
 * The shell renders the FIXED chrome ONCE per flow — background + blobs,
 * hero side, brand-in-card, settings button + dialog, decor plants — and
 * only the children (<Outlet/>) swap on navigation. The hero IMAGE may
 * follow the route via config.heroes (derive-from-pathname, same pattern as
 * the teacher workspace navbar): the img src changes, nothing re-mounts.
 *
 * Config shape (see studentShellConfig.js for a live example):
 *   defaultHero   { image, objectPosition }  — the flow's hero art
 *   heroes        { [pathname]: hero }       — optional per-route override
 *   cardWidth     "wide" | "narrow"          — desktop card width variant
 *   brandTitleAs  heading tag for the brand title ("h1" | "div"...)
 *   shellPlants   { placements, opacity }    — desktop dead-space foliage
 *   cardStripOpacity number | null           — phone in-card ground strip
 */
export default function EntryShell({ config, children }) {
  const { t } = useTranslation(I18N_NAMESPACES.PUBLIC_ENTRY);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { pathname } = useLocation();

  const hero = config.heroes?.[pathname] ?? config.defaultHero;

  // Warm the browser cache for the flow's OTHER hero images once the shell
  // is up, so a route swap inside the flow (e.g. join → waiting) shows its
  // art instantly. The current hero needs no preload — its <img> below is
  // already the fetch.
  useEffect(() => {
    const others = [config.defaultHero, ...Object.values(config.heroes ?? {})]
      .map((h) => h.image)
      .filter((image) => image !== hero.image);

    [...new Set(others)].forEach((image) => {
      const preloaded = new Image();
      preloaded.src = image;
    });
  }, [config, hero.image]);

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
            {/* The first thing the eye meets — fetch it ahead of the queue. */}
            <img
              src={hero.image}
              alt=""
              className={S.heroImage}
              style={{ objectPosition: hero.objectPosition }}
              decoding="async"
              fetchPriority="high"
            />
          </div>

          <div className={S.contentSide}>
            <div
              className={cx(
                S.floatingCard,
                ENTRY_SHELL_CARD_WIDTHS[config.cardWidth] ??
                  ENTRY_SHELL_CARD_WIDTHS.wide,
              )}
            >
              <div className={S.cardInner}>
                <div className={S.brand}>
                  <BrandWordmark
                    title={BRAND_TITLE}
                    subtitle={t("landing.tagline")}
                    size="md"
                    titleAs={config.brandTitleAs}
                  />
                </div>

                <main className={S.outletHost}>{children}</main>
              </div>

              {config.cardStripOpacity != null && (
                <div aria-hidden="true" className={S.cardLeafLayer}>
                  <JungleCornerPlants
                    placements={CARD_STRIP_PLACEMENTS}
                    opacity={config.cardStripOpacity}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {config.shellPlants && (
        <div aria-hidden="true" className={S.shellLeafLayer}>
          <JungleCornerPlants
            placements={config.shellPlants.placements}
            opacity={config.shellPlants.opacity}
          />
        </div>
      )}

      <PublicSettingsDialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </div>
  );
}
