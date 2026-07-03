import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Button,
  Group,
  PinInput,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { useForm } from "@mantine/form";

import { I18N_NAMESPACES } from "../../../i18n/i18nConstants";
import { ROUTES } from "../../../constants/routeConstants";
import { UI_TONES } from "../../../app/theme/quizWheelzTheme";
import useJoinRace from "../hooks/useJoinRace";
import {
  DISPLAY_NAME_MAX_LENGTH,
  DISPLAY_NAME_MIN_LENGTH,
  ROOM_CODE_ALLOWED_CHARS,
  ROOM_CODE_LENGTH,
} from "../config/studentJoinConfig";

// A code arriving from a link/QR is trusted but SHOWN and editable — the
// child can fix a wrong code without going anywhere.
function normalizeCodeFromUrl(rawCode) {
  const cleaned = (rawCode ?? "").trim().toUpperCase();

  return ROOM_CODE_ALLOWED_CHARS.test(cleaned)
    ? cleaned.slice(0, ROOM_CODE_LENGTH)
    : "";
}

/**
 * StudentJoinPage — ONE smart join form (room code + name, single submit).
 * /join/:roomCode (from the teacher's link/QR) prefills the code. A failed
 * join keeps the child right here with a friendly inline message — never a
 * step backward.
 */
export default function StudentJoinPage() {
  const { t } = useTranslation(I18N_NAMESPACES.STUDENT_JOIN);
  const { t: tErrors } = useTranslation(I18N_NAMESPACES.ERRORS);
  const navigate = useNavigate();
  const { roomCode: roomCodeFromUrl } = useParams();

  const prefilledCode = normalizeCodeFromUrl(roomCodeFromUrl);

  const { submitJoin, isJoining, joinErrorKey } = useJoinRace();

  const form = useForm({
    initialValues: {
      roomCode: prefilledCode,
      displayName: "",
    },
    validate: {
      roomCode: (value) =>
        value?.length === ROOM_CODE_LENGTH
          ? null
          : t("join.validation.roomCodeLength", { length: ROOM_CODE_LENGTH }),
      displayName: (value) => {
        const trimmed = value?.trim() ?? "";

        if (trimmed.length < DISPLAY_NAME_MIN_LENGTH) {
          return t("join.validation.nameMinLength", {
            min: DISPLAY_NAME_MIN_LENGTH,
          });
        }

        if (trimmed.length > DISPLAY_NAME_MAX_LENGTH) {
          return t("join.validation.nameMaxLength", {
            max: DISPLAY_NAME_MAX_LENGTH,
          });
        }

        return null;
      },
    },
  });

  function handleSubmit(values) {
    submitJoin({
      roomCode: values.roomCode,
      displayName: values.displayName.trim(),
    });
  }

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <Stack gap="md">
        <Stack gap={4} ta="center">
          <Title order={1} fz={26}>
            {t("join.title")}
          </Title>
          <Text c="dimmed" size="sm">
            {prefilledCode ? t("join.codeFromLink") : t("join.subtitle")}
          </Text>
        </Stack>

        <Stack gap={6} align="center">
          <Text component="label" size="sm" fw={600}>
            {t("join.roomCodeLabel")}
          </Text>
          <PinInput
            length={ROOM_CODE_LENGTH}
            type={ROOM_CODE_ALLOWED_CHARS}
            size="md"
            dir="ltr"
            value={form.values.roomCode}
            onChange={(value) =>
              form.setFieldValue("roomCode", value.toUpperCase())
            }
            error={Boolean(form.errors.roomCode)}
            aria-label={t("join.roomCodeLabel")}
          />
          {form.errors.roomCode && (
            <Text size="xs" c={UI_TONES.DANGER}>
              {form.errors.roomCode}
            </Text>
          )}
        </Stack>

        <TextInput
          label={t("join.nameLabel")}
          placeholder={t("join.namePlaceholder")}
          size="md"
          maxLength={DISPLAY_NAME_MAX_LENGTH}
          {...form.getInputProps("displayName")}
        />

        {joinErrorKey && (
          <Alert color={UI_TONES.DANGER} radius="md">
            {tErrors(joinErrorKey)}
          </Alert>
        )}

        <Stack gap="xs">
          <Button type="submit" size="lg" radius="xl" loading={isJoining}>
            {t("join.submit")}
          </Button>
          <Group justify="center">
            <Button
              variant="subtle"
              size="sm"
              onClick={() => navigate(ROUTES.LANDING)}
            >
              {t("join.back")}
            </Button>
          </Group>
        </Stack>
      </Stack>
    </form>
  );
}
