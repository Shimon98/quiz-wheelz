import { TEACHER_DASHBOARD_PANEL_STYLES } from "../../styles/dashboardUiStyles";
import RaceCard from "./RaceCard";

export default function RaceList({
                                     races,
                                     content,
                                     language,
                                     direction,
                                     onOpenRace,
                                     onEditRace,
                                     onCancelRace,
                                 }) {
    return (
        <div className={TEACHER_DASHBOARD_PANEL_STYLES.raceList} dir={direction}>
            {races.map((race) => (
                <RaceCard
                    key={race.raceId}
                    race={race}
                    content={content}
                    language={language}
                    direction={direction}
                    onOpenRace={onOpenRace}
                    onEditRace={onEditRace}
                    onCancelRace={onCancelRace}
                />
            ))}
        </div>
    );
}