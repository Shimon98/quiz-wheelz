package com.quiz_wheelz.service;

import com.quiz_wheelz.dto.teacher.TeacherRaceRoomResponse;
import com.quiz_wheelz.entitys.Race;
import com.quiz_wheelz.entitys.RacePlayer;
import com.quiz_wheelz.entitys.User;
import com.quiz_wheelz.exception.ApiException;
import com.quiz_wheelz.exception.ErrorCode;
import com.quiz_wheelz.repository.RacePlayerRepository;
import com.quiz_wheelz.repository.RaceRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class TeacherRaceRoomService {

    private final CurrentUserService currentUserService;
    private final UserService userService;
    private final RaceRepository raceRepository;
    private final RacePlayerRepository racePlayerRepository;

    public TeacherRaceRoomService(
            CurrentUserService currentUserService,
            UserService userService,
            RaceRepository raceRepository,
            RacePlayerRepository racePlayerRepository) {

        this.currentUserService = currentUserService;
        this.userService = userService;
        this.raceRepository = raceRepository;
        this.racePlayerRepository = racePlayerRepository;
    }

    @Transactional(readOnly = true)
    public TeacherRaceRoomResponse getRaceRoom(Long raceId) {
        Long teacherId = currentUserService.getCurrentUserId();
        User teacher = userService.findActiveByIdOrThrow(teacherId);
        Race race = raceRepository.findByIdAndTeacher(raceId, teacher)
                .orElseThrow(() -> new ApiException(ErrorCode.RACE_NOT_FOUND));
        List<RacePlayer> players = racePlayerRepository.findByRaceOrderByLaneNumberAsc(race);

        return TeacherRaceRoomResponse.from(race, players);
    }
}