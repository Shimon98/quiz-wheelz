import { TEACHER_DASHBOARD_PANEL_STYLES } from "../../styles/dashboardUiStyles";
import { cx } from "../../../../utils/classNameUtils";
import RaceCard from "./RaceCard";

export default function RaceList({
                                     races,
                                     content,
                                     language,
                                     direction,
                                     onOpenRace,
                                     onEditRace,
                                     onCancelRace,
                                     actionPresentation = "icon",
                                     className = "",
                                 }) {
    return (
        <div
            className={cx(TEACHER_DASHBOARD_PANEL_STYLES.raceList, className)}
            dir={direction}
        >
            {races.map((race) => (
                <div key={race.raceId} data-race-card-item>
                    <RaceCard
                        race={race}
                        content={content}
                        language={language}
                        direction={direction}
                        onOpenRace={onOpenRace}
                        onEditRace={onEditRace}
                        onCancelRace={onCancelRace}
                        actionPresentation={actionPresentation}
                    />
                </div>
            ))}
        </div>
    );
}
