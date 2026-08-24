package com.quiz_wheelz.service.teacher;

import com.quiz_wheelz.dto.teacher.TeacherRaceLivePlayerResponse;
import com.quiz_wheelz.dto.teacher.TeacherRaceLiveStateResponse;
import com.quiz_wheelz.entitys.Race;
import com.quiz_wheelz.entitys.User;
import com.quiz_wheelz.exception.ApiException;
import com.quiz_wheelz.exception.ErrorCode;
import com.quiz_wheelz.repository.RacePlayerRepository;
import com.quiz_wheelz.repository.RaceRepository;
import com.quiz_wheelz.service.auth.CurrentUserService;
import com.quiz_wheelz.service.auth.UserService;
import com.quiz_wheelz.service.raceplayer.RaceStandingCalculator;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.util.List;
import java.util.Objects;

@Service
public class TeacherRaceLiveStateService {

    private final CurrentUserService currentUserService;
    private final UserService userService;
    private final RaceRepository raceRepository;
    private final RacePlayerRepository racePlayerRepository;
    private final RaceStandingCalculator standingCalculator;
    private final Clock clock;

    public TeacherRaceLiveStateService(
            CurrentUserService currentUserService,
            UserService userService,
            RaceRepository raceRepository,
            RacePlayerRepository racePlayerRepository,
            RaceStandingCalculator standingCalculator,
            Clock clock
    ) {
        this.currentUserService = Objects.requireNonNull(currentUserService);
        this.userService = Objects.requireNonNull(userService);
        this.raceRepository = Objects.requireNonNull(raceRepository);
        this.racePlayerRepository = Objects.requireNonNull(racePlayerRepository);
        this.standingCalculator = Objects.requireNonNull(standingCalculator);
        this.clock = Objects.requireNonNull(clock);
    }

    @Transactional(readOnly = true)
    public TeacherRaceLiveStateResponse getLiveState(Long raceId) {
        Long teacherId = currentUserService.getCurrentUserId();
        User teacher = userService.findActiveByIdOrThrow(teacherId);
        Race race = raceRepository.findByIdAndTeacher(raceId, teacher)
                .orElseThrow(() -> new ApiException(ErrorCode.RACE_NOT_FOUND));

        List<TeacherRaceLivePlayerResponse> players = standingCalculator.calculate(
                        racePlayerRepository.findByRaceOrderByLaneNumberAsc(race)
                )
                .stream()
                .map(standing -> TeacherRaceLivePlayerResponse.from(
                        standing.racePlayer(),
                        standing.rank()
                ))
                .toList();

        return new TeacherRaceLiveStateResponse(
                race.getId(),
                race.getTitle(),
                race.getRoomCode(),
                race.getStatus().name(),
                race.getTotalDistance(),
                race.getFocusPolicy(),
                clock.millis(),
                race.getLiveEventVersion(),
                players
        );
    }
}
