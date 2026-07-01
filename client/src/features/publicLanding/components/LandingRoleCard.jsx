import {
  Avatar,
  Badge,
  Flex,
  Paper,
  Text,
  ThemeIcon,
  VisuallyHidden,
} from "@mantine/core";
import { ChevronRight } from "lucide-react";
import { cx } from "../../../utils/classNameUtils";
import {
  LANDING_ROLE_TONES,
  PUBLIC_LANDING_STYLES as S,
} from "../styles/publicLandingPageStyles";

const DEFAULT_TONE = "student";

/**
 * LandingRoleCard — one tappable role-choice card (student / teacher), rendered
 * from config. Mantine-native: Paper-as-button owns the surface; a responsive
 * Flex matches the vision (docs/vision/landing-entry.png):
 *   phone/tablet: compact ROW — media circle → text → arrow / "coming soon".
 *   desktop (lg = 75em = 1200, the shell split): large centered COLUMN card —
 *   big media circle on top, centered text, arrow circle at the bottom.
 * Tone drives the jungle green/blue accents via C-03 tokens; all text arrives
 * via props (i18n). Direction is inherited — only the chevron needs an rtl flip.
 */
export default function LandingRoleCard({
  title,
  description,
  actionLabel,
  tone = DEFAULT_TONE,
  media = null,
  FallbackIcon = null,
  disabled = false,
  onSelect,
  ariaLabel,
  className = "",
}) {
  const toneVars = LANDING_ROLE_TONES[tone] ?? LANDING_ROLE_TONES[DEFAULT_TONE];

  return (
    <Paper
      component="button"
      type="button"
      onClick={disabled ? undefined : onSelect}
      disabled={disabled}
      aria-label={ariaLabel || undefined}
      withBorder
      radius="xl"
      p={{ base: "md", lg: "lg" }}
      className={cx(S.roleCard, className)}
      style={{ borderColor: toneVars.accent, "--qw-tone": toneVars.accent }}
    >
      <Flex
        direction={{ base: "row", lg: "column" }}
        align="center"
        gap={{ base: "sm", lg: "md" }}
        w="100%"
        h="100%"
      >
        <Avatar
          src={media}
          alt=""
          size={56}
          w={{ base: 56, lg: 112 }}
          h={{ base: 56, lg: 112 }}
          style={{
            backgroundColor: toneVars.soft,
            boxShadow: `0 0 0 1px ${toneVars.accent}`,
            flexShrink: 0,
          }}
        >
          {FallbackIcon ? (
            <FallbackIcon aria-hidden="true" color={toneVars.accent} />
          ) : null}
        </Avatar>

        <Flex
          direction="column"
          align={{ base: "flex-start", lg: "center" }}
          gap={2}
          style={{ flex: 1, minWidth: 0 }}
        >
          {title && (
            <Text
              fw={800}
              fz={{ base: "md", lg: "xl" }}
              ta={{ base: "start", lg: "center" }}
              lh={1.2}
            >
              {title}
            </Text>
          )}
          {description && (
            <Text
              c="dimmed"
              fz="sm"
              ta={{ base: "start", lg: "center" }}
              lh={1.35}
            >
              {description}
            </Text>
          )}
        </Flex>

        {disabled ? (
          actionLabel && (
            <Badge variant="light" color="gray" radius="xl" style={{ flexShrink: 0 }}>
              {actionLabel}
            </Badge>
          )
        ) : (
          <>
            {actionLabel && <VisuallyHidden>{actionLabel}</VisuallyHidden>}
            <ThemeIcon
              aria-hidden="true"
              radius="xl"
              size={36}
              w={{ base: 36, lg: 44 }}
              h={{ base: 36, lg: 44 }}
              style={{
                backgroundColor: toneVars.accent,
                color: toneVars.accentContrast,
                flexShrink: 0,
              }}
            >
              <ChevronRight size={20} className={S.arrowIcon} />
            </ThemeIcon>
          </>
        )}
      </Flex>
    </Paper>
  );
}
