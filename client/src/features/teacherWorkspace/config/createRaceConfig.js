import { RACE_MAX_PLAYERS } from "../../../constants/raceRulesConstants";

const MIN_PLAYERS_OPTION = 2;

export const MAX_PLAYERS_OPTIONS = Object.freeze(
  Array.from(
    { length: RACE_MAX_PLAYERS - MIN_PLAYERS_OPTION + 1 },
    (_, index) => MIN_PLAYERS_OPTION + index,
  ),
);

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
