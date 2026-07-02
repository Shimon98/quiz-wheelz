import { useTranslation } from "react-i18next";
import {
  AppShell,
  Avatar,
  Badge,
  Button,
  Divider,
  Group,
  NavLink,
  ScrollArea,
  Stack,
  Text,
} from "@mantine/core";
import { LogOut } from "lucide-react";

import { I18N_NAMESPACES } from "../../../i18n/i18nConstants";
import { UI_TONES } from "../../../app/theme/quizWheelzTheme";
import { WORKSPACE_NAV_ITEMS } from "../config/workspaceNavigationConfig";
import WorkspaceBrand from "./WorkspaceBrand";

/**
 * TeacherWorkspaceNavbar — the navbar CONTENT (brand, profile, nav items,
 * logout), display-only. The shell owns what selecting an item actually does
 * (routing / opening settings), so the same navbar can later serve other
 * teacher pages and an admin variant with a different items config.
 */
export default function TeacherWorkspaceNavbar({
  activeId,
  teacherName,
  onItemSelect,
  onLogout,
  isLoggingOut,
}) {
  const { t } = useTranslation(I18N_NAMESPACES.TEACHER_WORKSPACE);
  const roleLabel = t("profile.role");

  return (
    <>
      <AppShell.Section p="md" visibleFrom="sm">
        <WorkspaceBrand />
      </AppShell.Section>

      <Divider visibleFrom="sm" />

      <AppShell.Section p="md">
        <Group gap="sm" wrap="nowrap">
          <Avatar
            name={teacherName ?? roleLabel}
            color="initials"
            radius="xl"
          />
          <Stack gap={0} miw={0}>
            <Text fw={700} truncate>
              {teacherName ?? roleLabel}
            </Text>
            <Text size="xs" c="dimmed">
              {roleLabel}
            </Text>
          </Stack>
        </Group>
      </AppShell.Section>

      <AppShell.Section grow component={ScrollArea} px="sm">
        <Stack gap={4}>
          {WORKSPACE_NAV_ITEMS.map((item) => {
            const ItemIcon = item.icon;

            return (
              <NavLink
                key={item.id}
                component="button"
                active={item.id === activeId}
                disabled={item.disabled}
                label={t(item.labelKey)}
                leftSection={<ItemIcon size={18} aria-hidden="true" />}
                rightSection={
                  item.disabled ? (
                    <Badge
                      size="xs"
                      variant="light"
                      color={UI_TONES.NEUTRAL}
                    >
                      {t("nav.comingSoon")}
                    </Badge>
                  ) : undefined
                }
                onClick={() => onItemSelect(item)}
                style={{ borderRadius: "var(--mantine-radius-md)" }}
              />
            );
          })}
        </Stack>
      </AppShell.Section>

      <AppShell.Section p="sm">
        {/* Slot for the jungle footer decoration — lands here once Shimon
            provides the asset; the navbar layout is already reserved for it. */}
        <Button
          variant="subtle"
          color={UI_TONES.DANGER}
          fullWidth
          justify="flex-start"
          leftSection={<LogOut size={18} aria-hidden="true" />}
          loading={isLoggingOut}
          onClick={onLogout}
        >
          {t("nav.logout")}
        </Button>
      </AppShell.Section>
    </>
  );
}
