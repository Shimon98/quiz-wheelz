package com.quiz_wheelz.service.teacher;
import com.quiz_wheelz.common.RaceRules;
import com.quiz_wheelz.dto.teacher.StartRaceResponse;
import com.quiz_wheelz.entitys.Race;
import com.quiz_wheelz.entitys.User;
import com.quiz_wheelz.enums.RacePlayerStatus;
import com.quiz_wheelz.enums.RaceStatus;
import com.quiz_wheelz.exception.ApiException;
import com.quiz_wheelz.exception.ErrorCode;
import com.quiz_wheelz.repository.RaceRepository;
import com.quiz_wheelz.service.auth.CurrentUserService;
import com.quiz_wheelz.service.auth.UserService;
import com.quiz_wheelz.service.raceplayer.RacePlayerService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;

@Service
public class TeacherRaceStartService {

    private final CurrentUserService currentUserService;
    private final UserService userService;
    private final RaceRepository raceRepository;
    private final RacePlayerService racePlayerService;

    public TeacherRaceStartService(
            CurrentUserService currentUserService,
            UserService userService,
            RaceRepository raceRepository,
            RacePlayerService racePlayerService
    ) {
        this.currentUserService = currentUserService;
        this.userService = userService;
        this.raceRepository = raceRepository;
        this.racePlayerService = racePlayerService;
    }

    @Transactional
    public StartRaceResponse startRace(Long raceId) {
        Long teacherId = currentUserService.getCurrentUserId();
        User teacher = userService.findActiveByIdOrThrow(teacherId);
        Race race = raceRepository.findByIdAndTeacherForUpdate(raceId, teacher)
                .orElseThrow(() -> new ApiException(ErrorCode.RACE_NOT_FOUND));
        validateRaceCanStart(race);
        validateMinimumPlayersToStart(race);
        LocalDateTime startedAt = LocalDateTime.now();
        int playersStarted = racePlayerService.startWaitingPlayers(race, startedAt);
        race.setStatus(RaceStatus.IN_PROGRESS);
        race.setStartedAt(startedAt);
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
