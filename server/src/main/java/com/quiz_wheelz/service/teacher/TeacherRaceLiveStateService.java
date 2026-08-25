package com.quiz_wheelz.service.teacher;

import com.quiz_wheelz.common.RaceProgressRules;
import com.quiz_wheelz.dto.teacher.TeacherRaceLivePlayerResponse;
import com.quiz_wheelz.dto.teacher.TeacherRaceLiveStateResponse;
import com.quiz_wheelz.entitys.Race;
import com.quiz_wheelz.entitys.User;
import com.quiz_wheelz.exception.ApiException;
import com.quiz_wheelz.exception.ErrorCode;
import com.quiz_wheelz.repository.RaceRepository;
import com.quiz_wheelz.service.auth.CurrentUserService;
import com.quiz_wheelz.service.auth.UserService;
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
    private final TeacherRaceLivePlayerSnapshotService playerSnapshotService;
    private final Clock clock;

    public TeacherRaceLiveStateService(
            CurrentUserService currentUserService,
            UserService userService,
            RaceRepository raceRepository,
            TeacherRaceLivePlayerSnapshotService playerSnapshotService,
            Clock clock
    ) {
        this.currentUserService = Objects.requireNonNull(currentUserService);
        this.userService = Objects.requireNonNull(userService);
        this.raceRepository = Objects.requireNonNull(raceRepository);
        this.playerSnapshotService = Objects.requireNonNull(playerSnapshotService);
        this.clock = Objects.requireNonNull(clock);
    }

    @Transactional(readOnly = true)
    public TeacherRaceLiveStateResponse getLiveState(Long raceId) {
        Long teacherId = currentUserService.getCurrentUserId();
        User teacher = userService.findActiveByIdOrThrow(teacherId);
        Race race = raceRepository.findByIdAndTeacher(raceId, teacher)
                .orElseThrow(() -> new ApiException(ErrorCode.RACE_NOT_FOUND));

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
