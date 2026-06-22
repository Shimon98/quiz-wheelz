import TeacherRacesPanel from "../races/TeacherRacesPanel.jsx";

export default function TeacherRacePanel({
    className = "",
    races,
    isLoading,
    error,
    onCreateRaceClick,
    onOpenRace,
}) {
    return (
        <TeacherRacesPanel
            races={races}
            isLoading={isLoading}
            error={error}
            onCreateRaceClick={onCreateRaceClick}
            onOpenRace={onOpenRace}
            className={className}
        />
    );
}
