import { useTranslation } from "react-i18next";
import { ActionIcon, Table, Text, useDirection } from "@mantine/core";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { I18N_NAMESPACES } from "../../../i18n/i18nConstants";
import { UI_TONES } from "../../../app/theme/quizWheelzTheme";
import RaceStatusBadge from "./RaceStatusBadge";
import RaceRoomCode from "./RaceRoomCode";
import RaceSubjectLabel from "./RaceSubjectLabel";

const EMPTY_CELL = "—";

/**
 * RacePreviewTable — desktop rendering of a race list. Receives ready-made
 * view models from raceDisplayUtils (same data as the mobile cards — only
 * the layout differs). Whole row opens the race; `renderRowAction` lets the
 * all-races page swap the chevron for a status-driven action button.
 */
export default function RacePreviewTable({ items, onOpenRace, renderRowAction }) {
  const { t } = useTranslation(I18N_NAMESPACES.TEACHER_WORKSPACE);
  const { dir } = useDirection();
  const ChevronIcon = dir === "rtl" ? ChevronLeft : ChevronRight;

  return (
    <Table highlightOnHover verticalSpacing="md" horizontalSpacing="md">
      <Table.Thead>
        <Table.Tr>
          <Table.Th>{t("races.columns.name")}</Table.Th>
          <Table.Th>{t("races.columns.subject")}</Table.Th>
          <Table.Th>{t("races.columns.players")}</Table.Th>
          <Table.Th>{t("races.columns.status")}</Table.Th>
          <Table.Th>{t("races.columns.roomCode")}</Table.Th>
          <Table.Th>{t("races.columns.createdAt")}</Table.Th>
          <Table.Th aria-label={t("races.open")} />
        </Table.Tr>
      </Table.Thead>

      <Table.Tbody>
        {items.map((item) => (
          <Table.Tr
            key={item.id}
            style={{ cursor: "pointer" }}
            onClick={() => onOpenRace(item.race)}
          >
            <Table.Td>
              <Text fw={700}>{item.title}</Text>
            </Table.Td>
            <Table.Td>
              <RaceSubjectLabel
                subjectKey={item.subjectKey}
                label={item.subjectName}
              />
            </Table.Td>
            <Table.Td>{item.playersLabel}</Table.Td>
            <Table.Td>
              <RaceStatusBadge status={item.status} />
            </Table.Td>
            <Table.Td>
              <RaceRoomCode code={item.roomCode} />
            </Table.Td>
            <Table.Td>
              <Text size="sm" c="dimmed">
                {item.createdAtLabel ?? EMPTY_CELL}
              </Text>
            </Table.Td>
            <Table.Td onClick={(event) => event.stopPropagation()}>
              {renderRowAction ? (
                renderRowAction(item)
              ) : (
                <ActionIcon
                  variant="subtle"
                  color={UI_TONES.NEUTRAL}
                  aria-label={t("races.open")}
                  onClick={() => onOpenRace(item.race)}
                >
                  <ChevronIcon size={18} aria-hidden="true" />
                </ActionIcon>
              )}
            </Table.Td>
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
  );
}
