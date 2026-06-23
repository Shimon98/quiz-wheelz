import { useState } from "react";
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
import Button from "../../../../shared/components/ui/Button";
import DashboardErrorState from "../ui/DashboardErrorState";
import DashboardLoadingState from "../ui/DashboardLoadingState";
import AllRacesModal from "./AllRacesModal";
import EmptyRacesState from "./EmptyRacesState";
import RaceList from "./RaceList";
import { useFittingRacePreviewCount } from "../../hooks/useFittingRacePreviewCount";

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
    const [isAllRacesModalOpen, setIsAllRacesModalOpen] = useState(false);

    const language = useLanguageStore((state) => state.language);
    const direction = getLanguageDirection(language);

    const content = useLocaleContent(TEACHER_DASHBOARD_CONTENT).racePreview;
    const raceContent = useLocaleContent(TEACHER_DASHBOARD_RACE_CONTENT);

    const hasRaces = races.length > 0;

    const {
        viewportRef: racePreviewViewportRef,
        visibleCount: visibleRaceCount,
    } = useFittingRacePreviewCount({
        totalItems: races.length,
        minCount: 1,
        maxCount: TEACHER_RACES_PREVIEW_LIMIT,
    });

    const previewRaces = races.slice(0, visibleRaceCount);
    const hasMoreRaces = races.length > visibleRaceCount;
    const showHeaderCreateButton = hasRaces && Boolean(onCreateRaceClick);
    const errorMessage = typeof error === "string" ? error : raceContent.loadError;

    function openAllRacesModal() {
        setIsAllRacesModalOpen(true);
    }

    function closeAllRacesModal() {
        setIsAllRacesModalOpen(false);
    }

    return (
        <>
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
                        <Button onClick={onCreateRaceClick}>
                            {content.createRaceButton}
                        </Button>
                    )}
                </div>

                <div className={TEACHER_DASHBOARD_PANEL_STYLES.racesContent}>
                    {isLoading && <DashboardLoadingState />}

                    {!isLoading && error && (
                        <DashboardErrorState message={errorMessage} />
                    )}

                    {!isLoading && !error && !hasRaces && (
                        <EmptyRacesState
                            message={content.emptyRacesMessage}
                            createRaceLabel={content.createRaceButton}
                            onCreateRaceClick={onCreateRaceClick}
                        />
                    )}

                    {!isLoading && !error && hasRaces && (
                        <>
                            <div
                                ref={racePreviewViewportRef}
                                className={TEACHER_DASHBOARD_PANEL_STYLES.racePreviewViewport}
                            >
                                <RaceList
                                    races={previewRaces}
                                    content={raceContent}
                                    language={language}
                                    direction={direction}
                                    onOpenRace={onOpenRace}
                                    onEditRace={onEditRace}
                                    onCancelRace={onCancelRace}
                                />
                            </div>

                            {hasMoreRaces && (
                                <div className={TEACHER_RACES_PREVIEW_STYLES.footer}>
                                    <Button
                                        variant="secondary"
                                        onClick={openAllRacesModal}
                                        className={TEACHER_RACES_PREVIEW_STYLES.showAllButton}
                                    >
                                        <span>{content.showAllRaces}</span>
                                        <ChevronDown
                                            size={18}
                                            aria-hidden="true"
                                            strokeWidth={2.5}
                                        />
                                    </Button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </section>

            <AllRacesModal
                isOpen={isAllRacesModalOpen}
                onClose={closeAllRacesModal}
                races={races}
                content={content}
                raceContent={raceContent}
                language={language}
                direction={direction}
                onOpenRace={onOpenRace}
                onEditRace={onEditRace}
                onCancelRace={onCancelRace}
            />
        </>
    );
}