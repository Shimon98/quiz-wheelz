import { ChevronDown, Flag } from "lucide-react";
import { useLocaleContent } from "../../../../constants/localeConstants";
import { useLanguageStore } from "../../../../stores/languageStore";
import { getLanguageDirection } from "../../../../utils/languageDirectionUtils";
import {
    TEACHER_DASHBOARD_CONTENT,
    TEACHER_DASHBOARD_RACE_CONTENT,
} from "../../content/teacherDashboardContent";
import { TEACHER_RACES_PREVIEW_LIMIT } from "../../config/teacherDashboardConfig";
import {
    TEACHER_DASHBOARD_PANEL_STYLES,
    TEACHER_RACES_PREVIEW_STYLES,
} from "../../styles/dashboardUiStyles";
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
    const language = useLanguageStore((state) => state.language);
    const direction = getLanguageDirection(language);

    const content = useLocaleContent(TEACHER_DASHBOARD_CONTENT).racePreview;
    const raceContent = useLocaleContent(TEACHER_DASHBOARD_RACE_CONTENT);

    const hasRaces = races.length > 0;
    const previewRaces = races.slice(0, TEACHER_RACES_PREVIEW_LIMIT);
    const hasMoreRaces = races.length > TEACHER_RACES_PREVIEW_LIMIT;
    const showHeaderCreateButton = hasRaces && Boolean(onCreateRaceClick);
    const errorMessage = typeof error === "string" ? error : raceContent.loadError;

    function handleShowAllRaces() {
        // Modal will be connected in the next step.
    }

    return (
        <section
            className={`${TEACHER_DASHBOARD_PANEL_STYLES.racesPanel} ${className}`.trim()}
            dir={direction}
        >
            <div className={TEACHER_RACES_PREVIEW_STYLES.header}>
                <div className={TEACHER_RACES_PREVIEW_STYLES.titleGroup}>
                    <span className={TEACHER_RACES_PREVIEW_STYLES.titleIcon}>
                        <Flag size={22} aria-hidden="true" />
                    </span>

                    <div>
                        <h2 className={TEACHER_RACES_PREVIEW_STYLES.title}>
                            {content.racesTitle}
                        </h2>

                        <p className={TEACHER_RACES_PREVIEW_STYLES.description}>
                            {content.racesDescription}
                        </p>
                    </div>
                </div>

                {showHeaderCreateButton && (
                    <DashboardButton onClick={onCreateRaceClick}>
                        {content.createRaceButton}
                    </DashboardButton>
                )}
            </div>

            <div className={TEACHER_DASHBOARD_PANEL_STYLES.racesContent}>
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
                    <>
                        <RaceList
                            races={previewRaces}
                            content={raceContent}
                            language={language}
                            direction={direction}
                            onOpenRace={onOpenRace}
                            onEditRace={onEditRace}
                            onCancelRace={onCancelRace}
                        />

                        {hasMoreRaces && (
                            <div className={TEACHER_RACES_PREVIEW_STYLES.footer}>
                                <DashboardButton
                                    variant="secondary"
                                    onClick={handleShowAllRaces}
                                    className={TEACHER_RACES_PREVIEW_STYLES.showAllButton}
                                >
                                    <span>{content.showAllRaces}</span>
                                    <ChevronDown
                                        size={18}
                                        aria-hidden="true"
                                        strokeWidth={2.5}
                                    />
                                </DashboardButton>
                            </div>
                        )}
                    </>
                )}
            </div>
        </section>
    );
}