package com.quiz_wheelz.dto.teacher;

import com.quiz_wheelz.enums.TeacherRaceResultAwardType;

import java.util.List;
import java.util.Objects;

public record TeacherRaceResultAwardResponse(
        TeacherRaceResultAwardType type,
        List<Long> racePlayerIds,
        int value
) {
    public TeacherRaceResultAwardResponse {
        racePlayerIds = List.copyOf(Objects.requireNonNull(racePlayerIds));
    }
}
