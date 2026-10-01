import { useCallback } from "react";
import { useNavigate } from "react-router-dom";

import {
  buildTeacherRaceLivePath,
  buildTeacherRaceResultsPath,
  buildTeacherRaceRoomPath,
} from "../../../constants/routeConstants";
import {
  getRacePrimaryAction,
  RACE_ACTION_KINDS,
} from "../config/raceActionsConfig";

const RACE_PATH_BUILDERS = Object.freeze({
  [RACE_ACTION_KINDS.ROOM]: buildTeacherRaceRoomPath,
  [RACE_ACTION_KINDS.LIVE]: buildTeacherRaceLivePath,
  [RACE_ACTION_KINDS.RESULTS]: buildTeacherRaceResultsPath,
});

export default function useTeacherRacePrimaryAction() {
  const navigate = useNavigate();

  return useCallback(
    (race) => {
      const buildRacePath = RACE_PATH_BUILDERS[getRacePrimaryAction(race?.status).kind];
      const raceId = race?.raceId ?? race?.id;

      if (buildRacePath && raceId != null) {
        navigate(buildRacePath(raceId));
      }
    },
    [navigate],
  );
}
