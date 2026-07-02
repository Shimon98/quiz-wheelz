import { Clock, Flag, Trophy, XCircle } from "lucide-react";
import { UI_TONES } from "../../../app/theme/quizWheelzTheme";

/*
 * The four dashboard stat cards, in display order (matching the vision image:
 * active / waiting / cancelled / total). `id` is the key into the stats object
 * built by dashboardStatsUtils. Adding a card = adding an entry here + an i18n
 * label; no component changes.
 */
export const DASHBOARD_STAT_CARDS = Object.freeze([
  {
    id: "active",
    tone: UI_TONES.SUCCESS,
    icon: Flag,
    labelKey: "stats.active",
  },
  {
    id: "waiting",
    tone: UI_TONES.WARNING,
    icon: Clock,
    labelKey: "stats.waiting",
  },
  {
    id: "cancelled",
    tone: UI_TONES.DANGER,
    icon: XCircle,
    labelKey: "stats.cancelled",
  },
  {
    id: "total",
    tone: UI_TONES.INFO,
    icon: Trophy,
    labelKey: "stats.total",
  },
]);
