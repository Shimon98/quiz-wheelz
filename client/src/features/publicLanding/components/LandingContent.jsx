import { SimpleGrid, Stack, Text, Title } from "@mantine/core";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { I18N_NAMESPACES } from "../../../i18n/i18nConstants";
import LandingRoleCard from "./LandingRoleCard";
import { LANDING_ROLES } from "../config/publicLandingConfig";

const ROLE_PROMPT_ID = "public-landing-role-prompt";

/**
 * LandingContent — the routed content of the landing card (rendered into the
 * PublicEntryShell <Outlet/>). Mantine-native: Title/Text for the heading
 * block, SimpleGrid for the role cards (1 column; 2 side-by-side only at the
 * desktop split, Mantine lg = 75em = 1200px, matching the shell). The shell
 * owns the hero, decor, brand, and settings — this component only knows about
 * choosing a role. All text comes from i18n (publicEntry namespace).
 */
export default function LandingContent() {
  const { t } = useTranslation(I18N_NAMESPACES.PUBLIC_ENTRY);
  const navigate = useNavigate();

  return (
    <>
      <Stack gap={4}>
        <Title order={2} fz={{ base: "h4", lg: "h3" }}>
          {t("welcome.title")}
        </Title>
        <Text
          component="h3"
          id={ROLE_PROMPT_ID}
          c="dimmed"
          fw={700}
          fz="sm"
        >
          {t("landing.rolePrompt")}
        </Text>
      </Stack>

      <SimpleGrid
        role="group"
        aria-labelledby={ROLE_PROMPT_ID}
        cols={{ base: 1, lg: 2 }}
        spacing={{ base: "sm", lg: "md" }}
      >
        {LANDING_ROLES.map((role) => (
          <LandingRoleCard
            key={role.id}
            tone={role.tone}
            media={role.media}
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
      </SimpleGrid>
    </>
  );
}
