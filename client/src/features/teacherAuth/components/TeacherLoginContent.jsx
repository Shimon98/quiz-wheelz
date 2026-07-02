import {
  Alert,
  Anchor,
  Button,
  Center,
  Group,
  Loader,
  PasswordInput,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Mail, CircleAlert } from "lucide-react";
import { I18N_NAMESPACES } from "../../../i18n/i18nConstants";
import { ROUTES } from "../../../constants/routeConstants";
import { UI_TONES } from "../../../app/theme/quizWheelzTheme";
import { AUTH_FORM_MAX_WIDTH } from "../config/teacherAuthConfig";
import useTeacherLogin from "../hooks/useTeacherLogin";

/**
 * TeacherLoginContent — the teacher sign-in screen, rendered into the
 * PublicEntryShell <Outlet/> (vision screen 1/2). Display-only: all logic
 * lives in useTeacherLogin; form value state in @mantine/form.
 *
 * The identifier field is email-FIRST (label says email, like the vision) but
 * accepts a username too while the server still authenticates by username —
 * so validation only requires it to be non-empty, not email-shaped.
 */
export default function TeacherLoginContent() {
  const { t } = useTranslation(I18N_NAMESPACES.TEACHER_AUTH);
  const { submit, submitting, errorMessage, checkingSession } =
    useTeacherLogin();

  const form = useForm({
    initialValues: { identifier: "", password: "" },
    validate: {
      identifier: (value) =>
        value.trim() ? null : t("validation.identifierRequired"),
      password: (value) => (value ? null : t("validation.passwordRequired")),
    },
  });

  if (checkingSession) {
    return (
      <Center py="xl">
        <Group gap="sm">
          <Loader size="sm" />
          <Text fw={700}>{t("login.checkingSession")}</Text>
        </Group>
      </Center>
    );
  }

  return (
    <Stack gap="lg" w="100%" maw={{ lg: AUTH_FORM_MAX_WIDTH }} mx="auto">
      <Stack gap={4}>
        <Title order={2} fz={{ base: "h4", lg: "h3" }}>
          {t("login.title")}
        </Title>
        <Text c="dimmed" fw={700} fz="sm">
          {t("login.subtitle")}
        </Text>
      </Stack>

      {errorMessage && (
        <Alert color={UI_TONES.DANGER} radius="lg" icon={<CircleAlert size={18} />}>
          {errorMessage}
        </Alert>
      )}

      <form onSubmit={form.onSubmit(submit)} noValidate>
        <Stack gap="sm">
          <TextInput
            label={t("common.emailLabel")}
            placeholder={t("common.emailPlaceholder")}
            size="md"
            autoComplete="username"
            rightSection={<Mail aria-hidden="true" size={18} />}
            {...form.getInputProps("identifier")}
          />
          <PasswordInput
            label={t("common.passwordLabel")}
            size="md"
            autoComplete="current-password"
            {...form.getInputProps("password")}
          />

          <Group justify="flex-start">
            <Anchor
              component={Link}
              to={ROUTES.TEACHER_FORGOT_PASSWORD}
              size="sm"
              fw={700}
            >
              {t("login.forgotPassword")}
            </Anchor>
          </Group>

          <Button type="submit" fullWidth size="md" loading={submitting}>
            {t("login.submit")}
          </Button>
        </Stack>
      </form>

      <Group justify="center" gap={6}>
        <Text fz="sm" c="dimmed">
          {t("login.noAccount")}
        </Text>
        <Anchor component={Link} to={ROUTES.TEACHER_REGISTER} size="sm" fw={700}>
          {t("login.registerLink")}
        </Anchor>
      </Group>
    </Stack>
  );
}
