import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Badge,
  Divider,
  Loader,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from "@mantine/core";

import { I18N_NAMESPACES } from "../../../i18n/i18nConstants";
import { UI_TONES } from "../../../app/theme/quizWheelzTheme";
import { RACE_VIEWS } from "../../../shared/racePlayer/getRaceView";
import RacePlayerSessionGate from "../../../shared/racePlayer/RacePlayerSessionGate";
import RetryableErrorAlert from "../../../shared/components/feedback/RetryableErrorAlert";
import { STUDENT_JOIN_STORAGE_KEY } from "../config/studentJoinConfig";
import useWaitingRace from "../hooks/useWaitingRace";
import StudentWaitingStatCard from "../components/StudentWaitingStatCard";

function readStoredJoin() {
  try {
    const raw = sessionStorage.getItem(STUDENT_JOIN_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/*
 * StudentWaitingPage — "you're in, hang tight". The server race-state is the
 * ONLY authority: useWaitingRace polls it while WAITING and navigates to the
 * race route once the race page owns the view; RacePlayerSessionGate sends a
 * dead RacePlayer identity back to join. The stored join response is an
 * OPTIONAL display cache (name/lane/counters race-state doesn't return) —
 * when it's missing the page still works from server data and simply hides
 * what it can't know; race title/room code prefer the fresher server values.
 */

function WaitingContent({ t, joinData, raceState, view, isLoading, error, retry }) {
  // Blocking states only while nothing is known yet — once a WAITING state
  // exists it keeps rendering through transient poll failures (last-known
  // state; the next poll retries silently, no toast spam).
  if (!raceState && isLoading) {
    return (
      <Stack align="center" py="xl" aria-busy="true">
        <Loader size="lg" />
      </Stack>
    );
  }

  if ((!raceState && error) || view === RACE_VIEWS.UNKNOWN) {
    return (
      <RetryableErrorAlert
        title={t("waiting.loadErrorTitle")}
        message={t(
          `${I18N_NAMESPACES.ERRORS}:${error?.messageKey ?? "general.unexpected"}`,
        )}
        retryLabel={t("waiting.retry")}
        onRetry={retry}
      />
    );
  }

  const playerName = joinData?.player?.displayName ?? "";
  const laneNumber = joinData?.player?.laneNumber;
  const raceTitle = raceState?.raceTitle ?? joinData?.raceTitle ?? "";
  const roomCode = raceState?.roomCode ?? joinData?.roomCode ?? "";

  // Small stat cubes — only the facts we actually have (join cache is
  // optional, so any of these may be absent).
  const statCards = [];
  if (laneNumber != null) {
    statCards.push({
      key: "lane",
      label: t("waiting.laneLabel"),
      value: laneNumber,
    });
  }
  if (joinData?.currentPlayers != null && joinData?.maxPlayers != null) {
    statCards.push({
      key: "players",
      label: t("waiting.playersLabel"),
      value: `${joinData.currentPlayers}/${joinData.maxPlayers}`,
      valueDir: "ltr",
    });
  }

  return (
    <Stack gap="md" ta="center" align="center">
      <Badge variant="light" color={UI_TONES.SUCCESS} size="lg" radius="xl">
        {t("waiting.joined")}
      </Badge>

      <Stack gap={2}>
        {/* Same brand-font treatment as the join title (see there). */}
        {playerName ? (
          <Title order={1} fz={{ base: 26, sm: 30 }} fw={700} ff="var(--font-sans)">
            {t("waiting.hello", { name: playerName })}
          </Title>
        ) : null}
        {raceTitle ? (
          <Text c="dimmed" fw={600}>
            {raceTitle}
          </Text>
        ) : null}
      </Stack>

      <Stack gap="xs" w="100%">
        {roomCode ? (
          <StudentWaitingStatCard
            label={t("waiting.roomCodeLabel")}
            value={roomCode}
            valueDir="ltr"
          />
        ) : null}
        {statCards.length > 0 && (
          <SimpleGrid cols={statCards.length} spacing="xs" w="100%">
            {statCards.map((card) => (
              <StudentWaitingStatCard
                key={card.key}
                label={card.label}
                value={card.value}
                valueDir={card.valueDir}
              />
            ))}
          </SimpleGrid>
        )}
      </Stack>

      <Divider w="100%" />

      <Stack gap={6} align="center">
        <Loader type="dots" size="lg" />
        <Text fw={700}>{t("waiting.waitingForTeacher")}</Text>
        <Text size="sm" c="dimmed">
          {t("waiting.keepOpen")}
        </Text>
      </Stack>
    </Stack>
  );
}

export default function StudentWaitingPage() {
  const { t } = useTranslation(I18N_NAMESPACES.STUDENT_JOIN);
  const [joinData] = useState(readStoredJoin);
  const { raceState, view, isLoading, error, retry } = useWaitingRace();

  return (
    <RacePlayerSessionGate error={error}>
      <WaitingContent
        t={t}
        joinData={joinData}
        raceState={raceState}
        view={view}
        isLoading={isLoading}
        error={error}
        retry={retry}
      />
    </RacePlayerSessionGate>
  );
}
