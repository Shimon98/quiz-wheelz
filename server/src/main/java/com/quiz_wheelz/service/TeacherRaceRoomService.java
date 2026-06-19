package com.quiz_wheelz.service;

import com.quiz_wheelz.dto.teacher.TeacherRaceRoomResponse;
import com.quiz_wheelz.entitys.Race;
import com.quiz_wheelz.entitys.User;
import com.quiz_wheelz.exception.ApiException;
import com.quiz_wheelz.exception.ErrorCode;
import com.quiz_wheelz.repository.RaceRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TeacherRaceRoomService {

    private final CurrentUserService currentUserService;
    private final UserService userService;
    private final RaceRepository raceRepository;

    public TeacherRaceRoomService(
            CurrentUserService currentUserService,
            UserService userService,
            RaceRepository raceRepository
    ) {
        this.currentUserService = currentUserService;
        this.userService = userService;
        this.raceRepository = raceRepository;
    }

    @Transactional(readOnly = true)
    public TeacherRaceRoomResponse getRaceRoom(Long raceId) {
        Long teacherId = currentUserService.getCurrentUserId();

        User teacher = userService.findActiveByIdOrThrow(teacherId);

        Race race = raceRepository.findByIdAndTeacher(raceId, teacher)
                .orElseThrow(() -> new ApiException(ErrorCode.RACE_NOT_FOUND));

        return TeacherRaceRoomResponse.from(race);
    }
}