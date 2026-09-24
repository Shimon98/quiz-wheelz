package com.quiz_wheelz.dto.teacher;

public record TeacherRaceResultPlayerResponse(
        Long racePlayerId,
        String displayName,
        Integer laneNumber,
        String vehicleTypeKey,
        String vehicleColorKey,
        String vehicleAssetKey,
        int rank,
        Integer score,
        Integer correctAnswers,
        Integer wrongAnswers,
        Integer bestStreak,
        Double position,
        String status,
        Long finishedAtEpochMs
) {
}
