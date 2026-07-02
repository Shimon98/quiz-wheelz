/*
 * Create-race form knobs. The teacher never sees "distance points" — race
 * length is short/regular/long in the UI and maps to the server's
 * totalDistance ONLY in the payload mapper (utils/createRacePayload.js).
 */

// Project rule: up to 8 racers per race.
export const MAX_PLAYERS_OPTIONS = Object.freeze([2, 3, 4, 5, 6, 7, 8]);

export const RACE_LENGTH_OPTIONS = Object.freeze([
  { value: "short", labelKey: "createRace.lengths.short", totalDistance: 600 },
  {
    value: "regular",
    labelKey: "createRace.lengths.regular",
    totalDistance: 1000,
  },
  { value: "long", labelKey: "createRace.lengths.long", totalDistance: 1400 },
]);

export const RACE_TITLE_MIN_LENGTH = 2;
export const RACE_TITLE_MAX_LENGTH = 40;

export const CREATE_RACE_DEFAULT_VALUES = Object.freeze({
  title: "",
  subjectId: "",
  maxPlayers: 4,
  raceLength: "regular",
});

// Future operators — UI scaffolding ONLY: rendered disabled with a "coming
// soon" note, never part of the payload (the server can't save them yet).
export const FUTURE_OPERATOR_OPTIONS = Object.freeze([
  { id: "addition", symbol: "+", labelKey: "createRace.operators.addition" },
  {
    id: "subtraction",
    symbol: "−",
    labelKey: "createRace.operators.subtraction",
  },
  {
    id: "multiplication",
    symbol: "×",
    labelKey: "createRace.operators.multiplication",
  },
  { id: "division", symbol: "÷", labelKey: "createRace.operators.division" },
]);
