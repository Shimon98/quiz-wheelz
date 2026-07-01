import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { I18N_NAMESPACES } from "../../../i18n/i18nConstants";
import LandingRoleCard from "./LandingRoleCard";
import { LANDING_ROLES } from "../config/publicLandingConfig";
import { PUBLIC_LANDING_STYLES as S } from "../styles/publicLandingPageStyles";

const ROLE_PROMPT_ID = "public-landing-role-prompt";

/**
 * LandingContent — the routed content of the landing card (rendered into the
 * PublicEntryShell <Outlet/>). Just the welcome heading, the role prompt, and
 * the two role cards from config. The shell owns the hero, decor, brand, and
 * settings — this component only knows about choosing a role. All text comes
 * from i18n (publicEntry namespace).
 */
export default function LandingContent() {
  const { t } = useTranslation(I18N_NAMESPACES.PUBLIC_ENTRY);
  const navigate = useNavigate();

  return (
    <>
      <div className={S.landingHeader}>
        <h2 className={S.welcomeTitle}>{t("welcome.title")}</h2>
        <h3 id={ROLE_PROMPT_ID} className={S.rolePrompt}>
          {t("landing.rolePrompt")}
        </h3>
      </div>

      <div role="group" aria-labelledby={ROLE_PROMPT_ID} className={S.roleGroup}>
        {LANDING_ROLES.map((role) => (
          <LandingRoleCard
            key={role.id}
            tone={role.tone}
            media={
              role.media ? (
                <img
                  src={role.media}
                  alt=""
                  aria-hidden="true"
                  className={S.roleMedia}
                />
              ) : undefined
            }
            FallbackIcon={role.FallbackIcon}
            title={t(`role.${role.i18nKey}.title`)}
            description={t(`role.${role.i18nKey}.description`)}
            actionLabel={
              role.disabled
                ? t(`role.${role.i18nKey}.comingSoon`)
                : t(`role.${role.i18nKey}.action`)
            }
            disabled={role.disabled}
            onSelect={role.disabled ? undefined : () => navigate(role.to)}
          />
        ))}
      </div>
    </>
  );
}
