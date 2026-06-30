import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { I18N_NAMESPACES } from "../../../i18n/i18nConstants";
import PublicEntryLayout, {
  PUBLIC_ENTRY_VARIANTS,
} from "../../../layouts/publicEntry";
import {
  BrandWordmark,
  PublicEntryCard,
  PUBLIC_ENTRY_CARD_VARIANTS,
} from "../../../shared/components/publicEntry";
import {
  PublicSettingsButton,
  PublicSettingsDialog,
} from "../../../shared/components/publicSettings";

import LandingHeroVisual from "../components/LandingHeroVisual";
import LandingRoleCard from "../components/LandingRoleCard";
import { BRAND_NAME, LANDING_ROLES } from "../config/publicLandingConfig";
import { PUBLIC_LANDING_STYLES as S } from "../styles/publicLandingPageStyles";

const ROLE_PROMPT_ID = "public-landing-role-prompt";

/**
 * PublicLandingPage — the public entry gate at "/".
 *
 * Thin page: composes the public layout (SHOWCASE) + components, sources all
 * text from i18n (publicEntry namespace), and owns only the settings-dialog
 * open flag. Asset-free — brand is text-only and the hero is token/CSS.
 * Direction/theme are inherited from the global providers (C-06).
 */
export default function PublicLandingPage() {
  const { t } = useTranslation(I18N_NAMESPACES.PUBLIC_ENTRY);
  const navigate = useNavigate();
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <PublicEntryLayout
      variant={PUBLIC_ENTRY_VARIANTS.SHOWCASE}
      topActionSlot={
        <PublicSettingsButton
          className="ms-auto"
          onClick={() => setSettingsOpen(true)}
        />
      }
    >
      <div className={S.grid}>
        <div className={S.heroCell}>
          <LandingHeroVisual />
        </div>

        <div className={S.cardCell}>
          <PublicEntryCard variant={PUBLIC_ENTRY_CARD_VARIANTS.WIDE}>
            <header className={S.cardHeader}>
              <BrandWordmark
                title={BRAND_NAME}
                subtitle={t("landing.tagline")}
                size="md"
                titleAs="h1"
              />
              <h2 className={S.welcomeTitle}>{t("welcome.title")}</h2>
            </header>

            <div
              role="group"
              aria-labelledby={ROLE_PROMPT_ID}
              className={S.roleSection}
            >
              <h3 id={ROLE_PROMPT_ID} className={S.rolePrompt}>
                {t("landing.rolePrompt")}
              </h3>

              <div className={S.roleGroup}>
                {LANDING_ROLES.map((role) => (
                  <LandingRoleCard
                    key={role.id}
                    tone={role.tone}
                    FallbackIcon={role.FallbackIcon}
                    title={t(`role.${role.i18nKey}.title`)}
                    description={t(`role.${role.i18nKey}.description`)}
                    actionLabel={
                      role.disabled
                        ? t(`role.${role.i18nKey}.comingSoon`)
                        : t(`role.${role.i18nKey}.action`)
                    }
                    disabled={role.disabled}
                    onSelect={
                      role.disabled ? undefined : () => navigate(role.to)
                    }
                  />
                ))}
              </div>
            </div>
          </PublicEntryCard>
        </div>
      </div>

      <PublicSettingsDialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </PublicEntryLayout>
  );
}
