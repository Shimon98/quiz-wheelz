import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Button,
  Group,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { UserRound } from "lucide-react";

import { I18N_NAMESPACES } from "../../../i18n/i18nConstants";
import { ROUTES } from "../../../constants/routeConstants";
import useJoinRace from "../hooks/useJoinRace";
import RoomCodePinInput from "../components/RoomCodePinInput";
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
  const navigate = useNavigate();
  const { roomCode: roomCodeFromUrl } = useParams();

  const prefilledCode = normalizeCodeFromUrl(roomCodeFromUrl);

  const { submitJoin, isJoining } = useJoinRace();

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
      <Stack gap="lg">
        <Stack gap={4} ta="center">
          {/* --font-sans = the Fredoka brand stack from index.css — Mantine
              Title otherwise applies its own Segoe headings default; 700 is
              Fredoka's real max weight (higher renders synthetic). */}
          <Title order={1} fz={{ base: 26, sm: 30 }} fw={700} ff="var(--font-sans)">
            {t("join.title")}
          </Title>
          <Text c="dimmed" size="sm" fw={500}>
            {prefilledCode ? t("join.codeFromLink") : t("join.subtitle")}
          </Text>
        </Stack>

        <RoomCodePinInput
          label={t("join.roomCodeLabel")}
          value={form.values.roomCode}
          onChange={(value) =>
            form.setFieldValue("roomCode", value.toUpperCase())
          }
          error={form.errors.roomCode}
        />

        <TextInput
          label={t("join.nameLabel")}
          placeholder={t("join.namePlaceholder")}
          size="lg"
          radius="md"
          leftSection={<UserRound size={20} aria-hidden="true" />}
          maxLength={DISPLAY_NAME_MAX_LENGTH}
          {...form.getInputProps("displayName")}
        />

        {/* Server failures pop as notifications (useApiErrorNotifier) — no
            inline alert, so the card never grows on error. */}
        <Stack gap="xs">
          <Button
            type="submit"
            size="lg"
            radius="xl"
            fw={800}
            loading={isJoining}
          >
            {t("join.submit")}
          </Button>
          <Group justify="center">
            <Button
              variant="subtle"
              size="sm"
              radius="xl"
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
