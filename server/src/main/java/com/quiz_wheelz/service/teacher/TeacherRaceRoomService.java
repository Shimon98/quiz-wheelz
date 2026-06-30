package com.quiz_wheelz.service.teacher;

import com.quiz_wheelz.dto.teacher.TeacherRaceRoomResponse;
import com.quiz_wheelz.entitys.Race;
import com.quiz_wheelz.entitys.RacePlayer;
import com.quiz_wheelz.entitys.User;
import com.quiz_wheelz.exception.ApiException;
import com.quiz_wheelz.exception.ErrorCode;
import com.quiz_wheelz.repository.RacePlayerRepository;
import com.quiz_wheelz.repository.RaceRepository;
import com.quiz_wheelz.service.auth.CurrentUserService;
import com.quiz_wheelz.service.auth.UserService;
import com.quiz_wheelz.service.raceplayer.RacePlayerService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class TeacherRaceRoomService {

    private final CurrentUserService currentUserService;
    private final UserService userService;
    private final RaceRepository raceRepository;
    private final RacePlayerService racePlayerService;

    public TeacherRaceRoomService(
            CurrentUserService currentUserService,
            UserService userService,
            RaceRepository raceRepository,
            RacePlayerService racePlayerService) {

        this.currentUserService = currentUserService;
        this.userService = userService;
        this.raceRepository = raceRepository;
        this.racePlayerService = racePlayerService;
    }

    @Transactional(readOnly = true)
    public TeacherRaceRoomResponse getRaceRoom(Long raceId) {
        Long teacherId = currentUserService.getCurrentUserId();
        User teacher = userService.findActiveByIdOrThrow(teacherId);
        Race race = raceRepository.findByIdAndTeacher(raceId, teacher)
                .orElseThrow(() -> new ApiException(ErrorCode.RACE_NOT_FOUND));
        List<RacePlayer> players = racePlayerService.findPlayersByRaceOrderedByLane(race);

        return TeacherRaceRoomResponse.from(race, players);
    }
}
