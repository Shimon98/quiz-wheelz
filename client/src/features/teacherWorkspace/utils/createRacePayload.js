import { RACE_LENGTH_OPTIONS } from "../config/createRaceConfig";

/*
 * Form values -> the server's create-race DTO. The ONLY place that knows the
 * server wants totalDistance instead of a length name — if Diana ever moves
 * the API to raceLength, this mapper is the single change.
 *
 * Operators are intentionally absent: the server can't save them yet.
 */
export function buildCreateRacePayload(formValues) {
  const lengthOption =
    RACE_LENGTH_OPTIONS.find(
      (option) => option.value === formValues.raceLength,
    ) ?? RACE_LENGTH_OPTIONS[1];

  return {
    title: formValues.title?.trim() ?? "",
    subjectId: Number(formValues.subjectId),
    maxPlayers: Number(formValues.maxPlayers),
    totalDistance: lengthOption.totalDistance,
  };
}
