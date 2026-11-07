import {
  BadgeCheck,
  BatteryCharging,
  CheckCircle2,
  Crown,
  Droplets,
  Flag,
  Flame,
  ShieldCheck,
  ShieldPlus,
  Trophy,
  TrendingUp,
  Wind,
  Zap,
} from "lucide-react";

import { UI_TONES } from "../../../app/theme/quizWheelzTheme";
import { RACE_PUBLIC_MOMENT_KINDS } from "../../../constants/raceLiveEventConstants";

// The public moments of S4-06 keep their server names as feed kinds; the rest are told from the server's rosters.
export const TEACHER_FEED_KINDS = Object.freeze({
  CORRECT_ANSWER: "CORRECT_ANSWER",
  RANK_UP: "RANK_UP",
  TOOK_LEAD: "TOOK_LEAD",
  STREAK: "STREAK",
  ...RACE_PUBLIC_MOMENT_KINDS,
  PLAYER_FINISHED: "PLAYER_FINISHED",
  RACE_FINISHED: "RACE_FINISHED",
});

export const TEACHER_FEED_MESSAGE_KEYS = Object.freeze({
  [TEACHER_FEED_KINDS.CORRECT_ANSWER]: "feed.correctAnswer",
  [TEACHER_FEED_KINDS.RANK_UP]: "feed.rankUp",
  [TEACHER_FEED_KINDS.TOOK_LEAD]: "feed.tookLead",
  [TEACHER_FEED_KINDS.STREAK]: "feed.streak",
  [TEACHER_FEED_KINDS.TURBO_SUCCESS]: "feed.turboSuccess",
  [TEACHER_FEED_KINDS.SAFE_PERFECT]: "feed.safePerfect",
  [TEACHER_FEED_KINDS.SHIELD_EARNED]: "feed.shieldEarned",
  [TEACHER_FEED_KINDS.LUCK_TAILWIND]: "feed.luckTailwind",
  [TEACHER_FEED_KINDS.LUCK_ENERGY_ORB]: "feed.luckEnergyOrb",
  [TEACHER_FEED_KINDS.LUCK_MUD]: "feed.luckMud",
  [TEACHER_FEED_KINDS.LUCK_SHIELD_BLOCKED]: "feed.luckShieldBlocked",
  [TEACHER_FEED_KINDS.PLAYER_FINISHED]: "feed.playerFinished",
  [TEACHER_FEED_KINDS.RACE_FINISHED]: "feed.raceFinished",
});

// The same icons the student's own screen uses for Turbo, Luck and the shield.
export const TEACHER_FEED_PRESENTATION = Object.freeze({
  [TEACHER_FEED_KINDS.CORRECT_ANSWER]: { icon: CheckCircle2, tone: UI_TONES.SUCCESS },
  [TEACHER_FEED_KINDS.RANK_UP]: { icon: TrendingUp, tone: UI_TONES.INFO },
  [TEACHER_FEED_KINDS.TOOK_LEAD]: { icon: Crown, tone: UI_TONES.WARNING },
  [TEACHER_FEED_KINDS.STREAK]: { icon: Flame, tone: UI_TONES.SUCCESS },
  [TEACHER_FEED_KINDS.TURBO_SUCCESS]: { icon: Zap, tone: UI_TONES.SUCCESS },
  [TEACHER_FEED_KINDS.SAFE_PERFECT]: { icon: BadgeCheck, tone: UI_TONES.SUCCESS },
  [TEACHER_FEED_KINDS.SHIELD_EARNED]: { icon: ShieldPlus, tone: UI_TONES.INFO },
  [TEACHER_FEED_KINDS.LUCK_TAILWIND]: { icon: Wind, tone: UI_TONES.INFO },
  [TEACHER_FEED_KINDS.LUCK_ENERGY_ORB]: { icon: BatteryCharging, tone: UI_TONES.INFO },
  [TEACHER_FEED_KINDS.LUCK_MUD]: { icon: Droplets, tone: UI_TONES.NEUTRAL },
  [TEACHER_FEED_KINDS.LUCK_SHIELD_BLOCKED]: { icon: ShieldCheck, tone: UI_TONES.INFO },
  [TEACHER_FEED_KINDS.PLAYER_FINISHED]: { icon: Flag, tone: UI_TONES.WARNING },
  [TEACHER_FEED_KINDS.RACE_FINISHED]: { icon: Trophy, tone: UI_TONES.WARNING },
});

// LOWEST is the plain correct answer: any other row of the same answer says more and takes its place.
export const TEACHER_FEED_PRIORITY = Object.freeze({ TOP: 0, HIGH: 1, MEDIUM: 2, LOW: 3, LOWEST: 4 });

// TOP is never held back. HIGH skips the class-wide window and the students' quiet gaps; only a new leader has a
// quiet time of its own (leadCooldownMs). MEDIUM, LOW and LOWEST share the window and each student's quiet gap, so the
// projector never floods.
export const TEACHER_FEED_PRIORITY_OF_KIND = Object.freeze({
  [TEACHER_FEED_KINDS.RACE_FINISHED]: TEACHER_FEED_PRIORITY.TOP,
  [TEACHER_FEED_KINDS.PLAYER_FINISHED]: TEACHER_FEED_PRIORITY.TOP,
  [TEACHER_FEED_KINDS.TOOK_LEAD]: TEACHER_FEED_PRIORITY.HIGH,
  [TEACHER_FEED_KINDS.TURBO_SUCCESS]: TEACHER_FEED_PRIORITY.HIGH,
  [TEACHER_FEED_KINDS.SAFE_PERFECT]: TEACHER_FEED_PRIORITY.HIGH,
  [TEACHER_FEED_KINDS.LUCK_SHIELD_BLOCKED]: TEACHER_FEED_PRIORITY.HIGH,
  // Every student earns the shield on the third right answer, mostly in the same minute: it waits its turn.
  [TEACHER_FEED_KINDS.SHIELD_EARNED]: TEACHER_FEED_PRIORITY.MEDIUM,
  [TEACHER_FEED_KINDS.LUCK_TAILWIND]: TEACHER_FEED_PRIORITY.MEDIUM,
  [TEACHER_FEED_KINDS.LUCK_ENERGY_ORB]: TEACHER_FEED_PRIORITY.MEDIUM,
  [TEACHER_FEED_KINDS.LUCK_MUD]: TEACHER_FEED_PRIORITY.MEDIUM,
  [TEACHER_FEED_KINDS.STREAK]: TEACHER_FEED_PRIORITY.MEDIUM,
  [TEACHER_FEED_KINDS.RANK_UP]: TEACHER_FEED_PRIORITY.LOW,
  [TEACHER_FEED_KINDS.CORRECT_ANSWER]: TEACHER_FEED_PRIORITY.LOWEST,
});

export const TEACHER_LIVE_FEED_CONFIG = Object.freeze({
  // The rows the projector keeps and shows (the reducer and the panel both cut here). More history, not more rows per
  // second: admission below still decides what gets in.
  maxItems: 7,
  // Times are the events' own server occurredAtEpochMs, so a replay decides exactly like the live run.
  admission: Object.freeze({
    // An event older than this when it reaches the screen (a replay after a reconnect) updates the race silently.
    replayTtlMs: 10_000,
    playerCooldownMs: 4_000,
    windowMs: 5_000,
    lowPriorityPerWindow: 2,
    // A plain correct answer may take only one of those places, so a busy class still sees its Luck, streaks and
    // climbs (seen live: correct answers came first and took every place).
    lowestPerWindow: 1,
    // Two students neck and neck swap the lead every few seconds (41 lead rows in 150 s, seen live): a new leader is
    // told at most once in this time for the class; the leaderboard always shows the current one.
    leadCooldownMs: 10_000,
  }),
});

export const TEACHER_FEED_ACCENT_PULSE = Object.freeze({
  animate: Object.freeze({ scale: [1, 1.28, 1] }),
  transition: Object.freeze({ duration: 0.7, ease: "easeOut" }),
});
