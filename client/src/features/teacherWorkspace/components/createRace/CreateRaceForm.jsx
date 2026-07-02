import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Button,
  Chip,
  Group,
  Select,
  SegmentedControl,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import { useForm } from "@mantine/form";

import { I18N_NAMESPACES } from "../../../../i18n/i18nConstants";
import { UI_TONES } from "../../../../app/theme/quizWheelzTheme";
import { useLanguageStore } from "../../../../stores/languageStore";
import { buildSubjectOptions } from "../../utils/raceDisplayUtils";
import {
  CREATE_RACE_DEFAULT_VALUES,
  FUTURE_OPERATOR_OPTIONS,
  MAX_PLAYERS_OPTIONS,
  RACE_LENGTH_OPTIONS,
  RACE_TITLE_MAX_LENGTH,
  RACE_TITLE_MIN_LENGTH,
} from "../../config/createRaceConfig";

/**
 * CreateRaceForm — display-only form (all behavior arrives via props from
 * useCreateRace through the modal). Validation errors stay inline here;
 * server errors surface as notifications from the hook.
 *
 * The operators section is future scaffolding: visible, disabled, clearly
 * marked "coming soon", and never part of the submitted values.
 */
export default function CreateRaceForm({
  subjects,
  isLoadingSubjects,
  subjectsFailed,
  onReloadSubjects,
  onSubmit,
  onCancel,
  isSubmitting,
}) {
  const { t } = useTranslation(I18N_NAMESPACES.TEACHER_WORKSPACE);
  const language = useLanguageStore((state) => state.language);

  const form = useForm({
    initialValues: { ...CREATE_RACE_DEFAULT_VALUES },
    validate: {
      title: (value) => {
        const trimmed = value?.trim() ?? "";

        if (trimmed.length < RACE_TITLE_MIN_LENGTH) {
          return t("createRace.validation.titleMinLength", {
            min: RACE_TITLE_MIN_LENGTH,
          });
        }

        if (trimmed.length > RACE_TITLE_MAX_LENGTH) {
          return t("createRace.validation.titleMaxLength", {
            max: RACE_TITLE_MAX_LENGTH,
          });
        }

        return null;
      },
      subjectId: (value) =>
        value ? null : t("createRace.validation.subjectRequired"),
    },
  });

  const subjectOptions = useMemo(
    () => buildSubjectOptions(subjects, language),
    [subjects, language],
  );

  const playersOptions = useMemo(
    () =>
      MAX_PLAYERS_OPTIONS.map((count) => ({
        value: String(count),
        label: String(count),
      })),
    [],
  );

  const lengthOptions = useMemo(
    () =>
      RACE_LENGTH_OPTIONS.map((option) => ({
        value: option.value,
        label: t(option.labelKey),
      })),
    [t],
  );

  return (
    <form onSubmit={form.onSubmit(onSubmit)}>
      <Stack gap="md">
        <TextInput
          label={t("createRace.nameLabel")}
          placeholder={t("createRace.namePlaceholder")}
          size="md"
          withAsterisk
          data-autofocus
          {...form.getInputProps("title")}
        />

        {subjectsFailed ? (
          <Alert color={UI_TONES.DANGER} radius="md">
            <Group justify="space-between" align="center">
              <Text size="sm">{t("createRace.subjectsLoadFailed")}</Text>
              <Button
                variant="light"
                color={UI_TONES.DANGER}
                size="xs"
                onClick={onReloadSubjects}
              >
                {t("states.retry")}
              </Button>
            </Group>
          </Alert>
        ) : (
          <Select
            label={t("createRace.subjectLabel")}
            placeholder={
              isLoadingSubjects
                ? t("createRace.subjectLoading")
                : t("createRace.subjectPlaceholder")
            }
            size="md"
            withAsterisk
            data={subjectOptions}
            disabled={isLoadingSubjects}
            allowDeselect={false}
            {...form.getInputProps("subjectId")}
          />
        )}

        <Stack gap={6}>
          <Text component="label" size="sm" fw={500}>
            {t("createRace.playersLabel")}
          </Text>
          <SegmentedControl
            fullWidth
            data={playersOptions}
            value={String(form.values.maxPlayers)}
            onChange={(value) =>
              form.setFieldValue("maxPlayers", Number(value))
            }
          />
        </Stack>

        <Stack gap={6}>
          <Text component="label" size="sm" fw={500}>
            {t("createRace.lengthLabel")}
          </Text>
          <SegmentedControl
            fullWidth
            data={lengthOptions}
            {...form.getInputProps("raceLength")}
          />
        </Stack>

        <Stack gap={6}>
          <Text size="sm" fw={500}>
            {t("createRace.operatorsTitle")}
          </Text>
          <Group gap="xs">
            {FUTURE_OPERATOR_OPTIONS.map((operator) => (
              <Chip key={operator.id} disabled checked={false} radius="md">
                <span dir="ltr">{operator.symbol}</span> {t(operator.labelKey)}
              </Chip>
            ))}
          </Group>
          <Text size="xs" c="dimmed">
            {t("createRace.operatorsSoon")}
          </Text>
        </Stack>

        <Group justify="space-between" mt="sm">
          <Button variant="default" onClick={onCancel} disabled={isSubmitting}>
            {t("createRace.cancel")}
          </Button>
          <Button
            type="submit"
            loading={isSubmitting}
            disabled={isLoadingSubjects || subjectsFailed}
          >
            {t("createRace.submit")}
          </Button>
        </Group>
      </Stack>
    </form>
  );
}
