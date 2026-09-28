import { useId } from "react";
import { useTranslation } from "react-i18next";
import { Table } from "@mantine/core";

import { I18N_NAMESPACES } from "../../../i18n/i18nConstants";
import { cx } from "../../../utils/classNameUtils";
import RaceRankMedal from "../../../shared/components/raceRank/RaceRankMedal";
import { TEACHER_RESULTS_STYLES as S } from "../styles/teacherRaceResultsStyles";

function TeacherResultsStandingRow({ row, t }) {
  return (
    <Table.Tr data-race-player-id={row.racePlayerId}>
      <Table.Td>
        <RaceRankMedal rank={row.rank} medal={row.medal} accentColor={row.accentColor} />
      </Table.Td>
      <Table.Th scope="row" className={S.nameCell}>
        <span className={S.playerCell}>
          {row.vehicleSrc ? (
            <img
              className={cx(S.standingKart, !row.finished && S.standingKartMuted)}
              src={row.vehicleSrc}
              alt=""
              aria-hidden="true"
              draggable={false}
            />
          ) : null}
          <span className={S.standingName} title={row.displayName}>
            {row.displayName}
          </span>
        </span>
      </Table.Th>
      <Table.Td>{row.score}</Table.Td>
      <Table.Td className={S.cellWide}>{row.correctAnswers}</Table.Td>
      <Table.Td className={S.cellWide}>{row.wrongAnswers}</Table.Td>
      <Table.Td className={S.cellWider}>{row.bestStreak}</Table.Td>
      <Table.Td>
        {row.finished ? (
          <span dir="ltr">{row.finishTimeLabel ?? t("standings.timeUnavailable")}</span>
        ) : (
          <span className={S.statusText}>{t("standings.didNotFinish")}</span>
        )}
      </Table.Td>
    </Table.Tr>
  );
}

export default function TeacherResultsStandings({ rows }) {
  const { t } = useTranslation(I18N_NAMESPACES.TEACHER_RACE_RESULTS);
  const titleId = useId();
  const noteId = useId();

  return (
    <section className={S.panel} aria-labelledby={titleId}>
      <h2 id={titleId} className={S.panelTitle}>
        {t("standings.title")}
      </h2>
      <p id={noteId} className={S.standingsNote}>
        {t("standings.rankingNote")}
      </p>
      <Table
        className={S.table}
        verticalSpacing="xs"
        horizontalSpacing="xs"
        aria-labelledby={titleId}
        aria-describedby={noteId}
      >
        <Table.Thead>
          <Table.Tr>
            <Table.Th scope="col">{t("standings.rank")}</Table.Th>
            <Table.Th scope="col">{t("standings.player")}</Table.Th>
            <Table.Th scope="col">{t("standings.score")}</Table.Th>
            <Table.Th scope="col" className={S.cellWide}>
              {t("standings.correct")}
            </Table.Th>
            <Table.Th scope="col" className={S.cellWide}>
              {t("standings.wrong")}
            </Table.Th>
            <Table.Th scope="col" className={S.cellWider}>
              {t("standings.bestStreak")}
            </Table.Th>
            <Table.Th scope="col">{t("standings.finishTime")}</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {rows.map((row) => (
            <TeacherResultsStandingRow key={row.racePlayerId} row={row} t={t} />
          ))}
        </Table.Tbody>
      </Table>
    </section>
  );
}
