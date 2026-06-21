import TeacherRacePanel from "./TeacherRacePanel";

export default function TeacherDashboardPanels({
    races,
    isRacesLoading,
    racesError,
    onCreateRaceClick,
    onOpenRace,
}) {
    return (
        <div className="min-h-0 flex-1">
            <TeacherRacePanel
                className="h-full"
                races={races}
                isLoading={isRacesLoading}
                error={racesError}
                onCreateRaceClick={onCreateRaceClick}
                onOpenRace={onOpenRace}
            />
        </div>
    );
}
