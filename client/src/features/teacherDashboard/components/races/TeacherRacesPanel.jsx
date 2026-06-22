import { useLocaleContent } from "../../../../constants/localeConstants";
import {
    TEACHER_DASHBOARD_CONTENT,
    TEACHER_DASHBOARD_RACE_CONTENT,
} from "../../content/teacherDashboardContent";
import DashboardButton from "../ui/DashboardButton";
import DashboardErrorState from "../ui/DashboardErrorState";
import DashboardLoadingState from "../ui/DashboardLoadingState";
import EmptyRacesState from "./EmptyRacesState";
import RaceList from "./RaceList";

export default function TeacherRacesPanel({
    races = [],
    isLoading = false,
    error = null,
    onCreateRaceClick,
    onOpenRace,
    onEditRace,
    onCancelRace,
    className = "",
}) {
    const content = useLocaleContent(TEACHER_DASHBOARD_CONTENT).racePreview;
    const raceContent = useLocaleContent(TEACHER_DASHBOARD_RACE_CONTENT);
    const hasRaces = races.length > 0;
    const showHeaderCreateButton = hasRaces && Boolean(onCreateRaceClick);
    const errorMessage = typeof error === "string" ? error : raceContent.loadError;

    return (
        <section
            className={`flex min-h-0 flex-col rounded-3xl bg-white/80 p-6 text-start shadow-md ${className}`}
            dir="auto"
        >
            <div className="flex shrink-0 flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">
                        {content.racesTitle}
                    </h2>

                    <p className="mt-1 text-slate-600">
                        {content.racesDescription}
                    </p>
                </div>

                {showHeaderCreateButton && (
                    <DashboardButton onClick={onCreateRaceClick}>
                        {content.createRaceButton}
                    </DashboardButton>
                )}
            </div>

            <div className="mt-6 min-h-0 flex-1 overflow-hidden">
                {isLoading && <DashboardLoadingState />}

                {!isLoading && error && <DashboardErrorState message={errorMessage} />}

                {!isLoading && !error && !hasRaces && (
                    <EmptyRacesState
                        message={content.emptyRacesMessage}
                        createRaceLabel={content.createRaceButton}
                        onCreateRaceClick={onCreateRaceClick}
                    />
                )}

                {!isLoading && !error && hasRaces && (
                    <RaceList
                        races={races}
                        content={raceContent}
                        onOpenRace={onOpenRace}
                        onEditRace={onEditRace}
                        onCancelRace={onCancelRace}
                    />
                )}
            </div>
        </section>
    );
}
