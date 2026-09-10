package com.quiz_wheelz.service.teacher;
import com.quiz_wheelz.common.RaceRules;
import com.quiz_wheelz.dto.teacher.StartRaceResponse;
import com.quiz_wheelz.entitys.Race;
import com.quiz_wheelz.enums.RacePlayerStatus;
import com.quiz_wheelz.enums.RaceStatus;
import com.quiz_wheelz.exception.ApiException;
import com.quiz_wheelz.exception.ErrorCode;
import com.quiz_wheelz.service.liveevent.RaceLiveEventRecorder;
import com.quiz_wheelz.service.raceplayer.RacePlayerService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.Clock;
import java.time.LocalDateTime;

@Service
public class TeacherRaceStartService {

    private final TeacherRaceAccessService raceAccessService;
    private final RacePlayerService racePlayerService;
    private final RaceLiveEventRecorder liveEventRecorder;
    private final Clock clock;

    public TeacherRaceStartService(
            TeacherRaceAccessService raceAccessService,
            RacePlayerService racePlayerService,
            RaceLiveEventRecorder liveEventRecorder,
            Clock clock
    ) {
        this.raceAccessService = raceAccessService;
        this.racePlayerService = racePlayerService;
        this.liveEventRecorder = liveEventRecorder;
        this.clock = clock;
    }

    @Transactional
    public StartRaceResponse startRace(Long raceId) {
        Race race = raceAccessService.requireOwnedRaceForUpdate(raceId);
        validateRaceCanStart(race);
        validateMinimumPlayersToStart(race);
        LocalDateTime startedAt = LocalDateTime.now(clock);
        int playersStarted = racePlayerService.startWaitingPlayers(race, startedAt);
        race.setStatus(RaceStatus.IN_PROGRESS);
        race.setStartedAt(startedAt);
        liveEventRecorder.recordRaceStarted(race);
        return StartRaceResponse.from(race, playersStarted);
    }

    private void validateRaceCanStart(Race race) {
        if (race.getStatus() != RaceStatus.WAITING_FOR_PLAYERS) {
            throw new ApiException(ErrorCode.RACE_CANNOT_START_IN_CURRENT_STATUS);}
    }

    private void validateMinimumPlayersToStart(Race race) {
        long waitingPlayers = racePlayerService.countPlayersByRaceAndStatus(
                race, RacePlayerStatus.WAITING);
        if (waitingPlayers < RaceRules.MIN_PLAYERS_TO_START) {
            throw new ApiException(ErrorCode.RACE_CANNOT_START_WITHOUT_PLAYERS);
        }
    }
}
