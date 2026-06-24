import { useNavigate } from "react-router-dom";
import { getRaceNavigationPath } from "../utils/raceNavigationUtils";

export function useRaceNavigation() {
    const navigate = useNavigate();

    function handleOpenRace(race) {
        const path = getRaceNavigationPath(race);

        if (path) {
            navigate(path);
        }
    }

    return {
        handleOpenRace,
    };
}
