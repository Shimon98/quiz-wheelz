package com.quiz_wheelz.service.teacher;

import com.quiz_wheelz.common.RaceProgressRules;
import com.quiz_wheelz.dto.teacher.TeacherRaceLivePlayerResponse;
import com.quiz_wheelz.dto.teacher.TeacherRaceLiveStateResponse;
import com.quiz_wheelz.entitys.Race;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.util.List;
import java.util.Objects;

@Service
public class TeacherRaceLiveStateService {

    private final TeacherRaceAccessService raceAccessService;
    private final TeacherRaceLivePlayerSnapshotService playerSnapshotService;
    private final Clock clock;

    public TeacherRaceLiveStateService(
            TeacherRaceAccessService raceAccessService,
            TeacherRaceLivePlayerSnapshotService playerSnapshotService,
            Clock clock
    ) {
        this.raceAccessService = Objects.requireNonNull(raceAccessService);
        this.playerSnapshotService = Objects.requireNonNull(playerSnapshotService);
        this.clock = Objects.requireNonNull(clock);
    }

    @Transactional(readOnly = true)
    public TeacherRaceLiveStateResponse getLiveState(Long raceId) {
        Race race = raceAccessService.requireOwnedRace(raceId);

        List<TeacherRaceLivePlayerResponse> players =
                playerSnapshotService.getOrderedPlayers(race);

        return new TeacherRaceLiveStateResponse(
                race.getId(),
                race.getTitle(),
                race.getRoomCode(),
                race.getStatus().name(),
                race.getTotalDistance(),
                race.getFocusPolicy(),
                clock.millis(),
                RaceProgressRules.BASE_MOVEMENT_UNITS_PER_SECOND,
                race.getLiveEventVersion(),
                players
        );
    }
}
