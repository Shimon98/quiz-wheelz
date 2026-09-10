package com.quiz_wheelz.service.teacher;

import com.quiz_wheelz.entitys.Race;
import com.quiz_wheelz.entitys.User;
import com.quiz_wheelz.exception.ApiException;
import com.quiz_wheelz.exception.ErrorCode;
import com.quiz_wheelz.repository.RaceRepository;
import com.quiz_wheelz.service.auth.CurrentUserService;
import com.quiz_wheelz.service.auth.UserService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Objects;

@Service
public class TeacherRaceAccessService {

    private final CurrentUserService currentUserService;
    private final UserService userService;
    private final RaceRepository raceRepository;

    public TeacherRaceAccessService(
            CurrentUserService currentUserService,
            UserService userService,
            RaceRepository raceRepository
    ) {
        this.currentUserService = Objects.requireNonNull(currentUserService);
        this.userService = Objects.requireNonNull(userService);
        this.raceRepository = Objects.requireNonNull(raceRepository);
    }

    @Transactional(readOnly = true)
    public Race requireOwnedRace(Long raceId) {
        User teacher = currentTeacher();
        return raceRepository.findByIdAndTeacher(raceId, teacher)
                .orElseThrow(() -> new ApiException(ErrorCode.RACE_NOT_FOUND));
    }

    @Transactional
    public Race requireOwnedRaceForUpdate(Long raceId) {
        User teacher = currentTeacher();
        return raceRepository.findByIdAndTeacherForUpdate(raceId, teacher)
                .orElseThrow(() -> new ApiException(ErrorCode.RACE_NOT_FOUND));
    }

    private User currentTeacher() {
        Long teacherId = currentUserService.getCurrentUserId();
        return userService.findActiveByIdOrThrow(teacherId);
    }
}
