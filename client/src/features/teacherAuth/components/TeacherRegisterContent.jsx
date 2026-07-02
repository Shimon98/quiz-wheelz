import {
  Alert,
  Anchor,
  Button,
  Checkbox,
  Group,
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
import {
  AUTH_FORM_MAX_WIDTH,
  EMAIL_PATTERN,
  PASSWORD_MIN_LENGTH,
} from "../config/teacherAuthConfig";
import useTeacherRegister from "../hooks/useTeacherRegister";

/**
 * TeacherRegisterContent — the create-teacher-account screen, rendered into the
 * PublicEntryShell <Outlet/> (vision screen 4). Display-only: submit logic in
 * useTeacherRegister; form value state in @mantine/form. Client-ready — waits
 * only on the server's /auth/register.
 */
export default function TeacherRegisterContent() {
  const { t } = useTranslation(I18N_NAMESPACES.TEACHER_AUTH);
  const { submit, submitting, errorMessage } = useTeacherRegister();

  const form = useForm({
    initialValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
      acceptsEmails: false,
    },
    validate: {
      fullName: (value) =>
        value.trim() ? null : t("validation.fullNameRequired"),
      email: (value) => {
        if (!value.trim()) return t("validation.emailRequired");
        return EMAIL_PATTERN.test(value) ? null : t("validation.emailInvalid");
      },
      password: (value) => {
        if (!value) return t("validation.passwordRequired");
        return value.length >= PASSWORD_MIN_LENGTH
          ? null
          : t("validation.passwordMinLength", { min: PASSWORD_MIN_LENGTH });
      },
      confirmPassword: (value, values) =>
        value === values.password ? null : t("validation.passwordsMismatch"),
    },
  });

  return (
    <Stack gap="lg" w="100%" maw={{ lg: AUTH_FORM_MAX_WIDTH }} mx="auto">
      <Stack gap={4}>
        <Title order={2} fz={{ base: "h4", lg: "h3" }}>
          {t("register.title")}
        </Title>
        <Text c="dimmed" fw={700} fz="sm">
          {t("register.subtitle")}
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
            label={t("register.fullNameLabel")}
            placeholder={t("register.fullNamePlaceholder")}
            size="md"
            autoComplete="name"
            {...form.getInputProps("fullName")}
          />
          <TextInput
            label={t("common.emailLabel")}
            placeholder={t("common.emailPlaceholder")}
            size="md"
            type="email"
            autoComplete="email"
            rightSection={<Mail aria-hidden="true" size={18} />}
            {...form.getInputProps("email")}
          />
          <PasswordInput
            label={t("common.passwordLabel")}
            size="md"
            autoComplete="new-password"
            {...form.getInputProps("password")}
          />
          <PasswordInput
            label={t("register.confirmPasswordLabel")}
            size="md"
            autoComplete="new-password"
            {...form.getInputProps("confirmPassword")}
          />
          <Checkbox
            label={t("register.acceptsEmailsLabel")}
            {...form.getInputProps("acceptsEmails", { type: "checkbox" })}
          />

          <Button type="submit" fullWidth size="md" loading={submitting}>
            {t("register.submit")}
          </Button>
        </Stack>
      </form>

      <Group justify="center" gap={6}>
        <Text fz="sm" c="dimmed">
          {t("register.hasAccount")}
        </Text>
        <Anchor component={Link} to={ROUTES.TEACHER_LOGIN} size="sm" fw={700}>
          {t("register.loginLink")}
        </Anchor>
      </Group>
    </Stack>
  );
}
