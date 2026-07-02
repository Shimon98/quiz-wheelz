import {
  Alert,
  Anchor,
  Button,
  Group,
  PasswordInput,
  PinInput,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Mail, CircleAlert, CircleCheck } from "lucide-react";
import { I18N_NAMESPACES } from "../../../i18n/i18nConstants";
import { ROUTES } from "../../../constants/routeConstants";
import { UI_TONES } from "../../../app/theme/quizWheelzTheme";
import {
  AUTH_FORM_MAX_WIDTH,
  EMAIL_PATTERN,
  FORGOT_PASSWORD_STEPS,
  PASSWORD_MIN_LENGTH,
  RESET_CODE_LENGTH,
} from "../config/teacherAuthConfig";
import useForgotPasswordFlow from "../hooks/useForgotPasswordFlow";

/**
 * ForgotPasswordContent — the 3-step password reset flow, rendered into the
 * PublicEntryShell <Outlet/> (vision screens 3 → 5 → 6):
 *   request (email) → verify (6-digit emailed code) → reset (new password) → done.
 * Display-only: the step machine, timers and API calls live in
 * useForgotPasswordFlow; each step's form state in @mantine/form.
 */
export default function ForgotPasswordContent() {
  const { t } = useTranslation(I18N_NAMESPACES.TEACHER_AUTH);
  const flow = useForgotPasswordFlow();

  return (
    <Stack gap="lg" w="100%" maw={{ lg: AUTH_FORM_MAX_WIDTH }} mx="auto">
      {flow.errorMessage && (
        <Alert color={UI_TONES.DANGER} radius="lg" icon={<CircleAlert size={18} />}>
          {flow.errorMessage}
        </Alert>
      )}

      {flow.step === FORGOT_PASSWORD_STEPS.REQUEST && (
        <RequestStep t={t} flow={flow} />
      )}
      {flow.step === FORGOT_PASSWORD_STEPS.VERIFY && (
        <VerifyStep t={t} flow={flow} />
      )}
      {flow.step === FORGOT_PASSWORD_STEPS.RESET && (
        <ResetStep t={t} flow={flow} />
      )}
      {flow.step === FORGOT_PASSWORD_STEPS.DONE && <DoneStep t={t} />}

      <Group justify="center">
        <Anchor component={Link} to={ROUTES.TEACHER_LOGIN} size="sm" fw={700}>
          {t("forgot.backToLogin")}
        </Anchor>
      </Group>
    </Stack>
  );
}

/* Step 1 — ask for the account email (vision screen 3). */
function RequestStep({ t, flow }) {
  const form = useForm({
    initialValues: { email: "" },
    validate: {
      email: (value) => {
        if (!value.trim()) return t("validation.emailRequired");
        return EMAIL_PATTERN.test(value) ? null : t("validation.emailInvalid");
      },
    },
  });

  return (
    <>
      <StepHeading
        title={t("forgot.requestTitle")}
        subtitle={t("forgot.requestSubtitle")}
      />
      <form onSubmit={form.onSubmit(flow.submitRequest)} noValidate>
        <Stack gap="sm">
          <TextInput
            label={t("common.emailLabel")}
            placeholder={t("common.emailPlaceholder")}
            size="md"
            type="email"
            autoComplete="email"
            rightSection={<Mail aria-hidden="true" size={18} />}
            {...form.getInputProps("email")}
          />
          <Button type="submit" fullWidth size="md" loading={flow.submitting}>
            {t("forgot.requestSubmit")}
          </Button>
        </Stack>
      </form>
    </>
  );
}

/* Step 2 — enter the emailed code (vision screen 5). */
function VerifyStep({ t, flow }) {
  const form = useForm({
    initialValues: { code: "" },
    validate: {
      code: (value) =>
        value.length === RESET_CODE_LENGTH
          ? null
          : t("validation.codeIncomplete", { codeLength: RESET_CODE_LENGTH }),
    },
  });

  return (
    <>
      <Alert color={UI_TONES.SUCCESS} radius="lg" icon={<CircleCheck size={18} />}>
        {t("forgot.sentNote")}
      </Alert>

      <StepHeading
        title={t("forgot.verifyTitle")}
        subtitle={t("forgot.verifySubtitle", {
          codeLength: RESET_CODE_LENGTH,
          email: flow.email,
        })}
      />

      <form onSubmit={form.onSubmit(flow.submitCode)} noValidate>
        <Stack gap="sm">
          {/* dir=ltr: a numeric code always reads left-to-right, also in Hebrew */}
          <Group justify="center" dir="ltr">
            <PinInput
              length={RESET_CODE_LENGTH}
              type="number"
              oneTimeCode
              autoFocus
              error={!!form.errors.code}
              {...form.getInputProps("code")}
            />
          </Group>
          {form.errors.code && (
            <Text c="red" fz="sm" ta="center">
              {form.errors.code}
            </Text>
          )}

          <Group justify="center" gap={6}>
            <Text fz="sm" c="dimmed">
              {t("forgot.noCode")}
            </Text>
            {flow.resendSecondsLeft > 0 ? (
              <Text fz="sm" fw={700}>
                {t("forgot.resendIn", { time: flow.resendClock })}
              </Text>
            ) : (
              <Anchor component="button" type="button" size="sm" fw={700} onClick={flow.resendCode}>
                {t("forgot.resend")}
              </Anchor>
            )}
          </Group>

          <Button type="submit" fullWidth size="md" loading={flow.submitting}>
            {t("forgot.verifySubmit")}
          </Button>
        </Stack>
      </form>
    </>
  );
}

/* Step 3 — choose the new password (vision screen 6). */
function ResetStep({ t, flow }) {
  const form = useForm({
    initialValues: { newPassword: "", confirmPassword: "" },
    validate: {
      newPassword: (value) => {
        if (!value) return t("validation.passwordRequired");
        return value.length >= PASSWORD_MIN_LENGTH
          ? null
          : t("validation.passwordMinLength", { min: PASSWORD_MIN_LENGTH });
      },
      confirmPassword: (value, values) =>
        value === values.newPassword
          ? null
          : t("validation.passwordsMismatch"),
    },
  });

  return (
    <>
      <StepHeading
        title={t("forgot.resetTitle")}
        subtitle={t("forgot.resetSubtitle")}
      />
      <form onSubmit={form.onSubmit(flow.submitNewPassword)} noValidate>
        <Stack gap="sm">
          <PasswordInput
            label={t("forgot.newPasswordLabel")}
            size="md"
            autoComplete="new-password"
            {...form.getInputProps("newPassword")}
          />
          <PasswordInput
            label={t("forgot.confirmPasswordLabel")}
            size="md"
            autoComplete="new-password"
            {...form.getInputProps("confirmPassword")}
          />
          <Button type="submit" fullWidth size="md" loading={flow.submitting}>
            {t("forgot.resetSubmit")}
          </Button>
        </Stack>
      </form>
    </>
  );
}

/* Step 4 — success (vision screen 6, green note). */
function DoneStep({ t }) {
  return (
    <Alert color={UI_TONES.SUCCESS} radius="lg" icon={<CircleCheck size={18} />}>
      {t("forgot.successNote")}
    </Alert>
  );
}

/* Shared heading block for every step. */
function StepHeading({ title, subtitle }) {
  return (
    <Stack gap={4}>
      <Title order={2} fz={{ base: "h4", lg: "h3" }}>
        {title}
      </Title>
      <Text c="dimmed" fw={700} fz="sm">
        {subtitle}
      </Text>
    </Stack>
  );
}
