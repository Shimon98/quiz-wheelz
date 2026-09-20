package com.quiz_wheelz.dto.teacher;

public record TeacherRaceResultsSummaryResponse(
        int finishedPlayers,
        int disconnectedPlayers,
        int totalCorrectAnswers,
        int totalWrongAnswers
) {
}
