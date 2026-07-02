import { useTranslation } from "react-i18next";
import { Box, Group, Stack, Text, Title } from "@mantine/core";

import { I18N_NAMESPACES } from "../../../i18n/i18nConstants";
import heroDesktopImage from "../../../assets/workspace/greeting-hero-desktop.png";
import heroMobileImage from "../../../assets/workspace/greeting-hero-mobile.png";

/*
 * Greeting text beside the monkey-kart art, holding the corner of the
 * dashboard. Two art variants, CSS-switched: desktop/tablet (>=sm) and the
 * compact phone one. STATIC by design — Shimon: idle motion here looked
 * forced; the art should just sit pretty in its corner.
 */
function GreetingArt({ src, height }) {
  return (
    <img
      src={src}
      alt=""
      aria-hidden="true"
      draggable="false"
      style={{ height, width: "auto", display: "block" }}
    />
  );
}

export default function TeacherGreetingSection({ name, action }) {
  const { t } = useTranslation(I18N_NAMESPACES.TEACHER_WORKSPACE);

  const title = name
    ? t("greeting.title", { name })
    : t("greeting.titleNoName");

  return (
    <Group justify="space-between" align="center" wrap="nowrap">
      <Stack gap={4}>
        <Title order={1} fz={{ base: 26, sm: 34 }}>
          {title}
        </Title>
        <Text c="dimmed">{t("greeting.subtitle")}</Text>
        {/* On desktop the primary action lives inside the hero row, using the
            art's height instead of pushing the whole page down. */}
        {action && (
          <Box visibleFrom="sm" mt="md">
            {action}
          </Box>
        )}
      </Stack>

      {/* flexShrink 0 so the art keeps its aspect ratio — otherwise the flex
          squeeze + Mantine's img max-width:100% squish the monkey. */}
      <Box visibleFrom="sm" style={{ flexShrink: 0 }}>
        <GreetingArt src={heroDesktopImage} height={224} />
      </Box>
      <Box hiddenFrom="sm" style={{ flexShrink: 0 }}>
        <GreetingArt src={heroMobileImage} height={100} />
      </Box>
    </Group>
  );
}
