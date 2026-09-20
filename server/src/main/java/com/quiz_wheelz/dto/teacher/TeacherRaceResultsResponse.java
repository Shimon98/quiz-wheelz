package com.quiz_wheelz.dto.teacher;

import com.quiz_wheelz.dto.subject.SubjectResponse;

import java.util.List;
import java.util.Objects;

public record TeacherRaceResultsResponse(
        Long raceId,
        String title,
        String roomCode,
        SubjectResponse subject,
        String status,
        Integer maxPlayers,
        int playerCount,
        Integer totalDistance,
        Long startedAtEpochMs,
        Long finishedAtEpochMs,
        List<Long> winnerRacePlayerIds,
        TeacherRaceResultsSummaryResponse summary,
        List<TeacherRaceResultAwardResponse> awards,
        List<TeacherRaceResultPlayerResponse> players
) {
    public TeacherRaceResultsResponse {
        winnerRacePlayerIds = List.copyOf(Objects.requireNonNull(winnerRacePlayerIds));
        awards = List.copyOf(Objects.requireNonNull(awards));
        players = List.copyOf(Objects.requireNonNull(players));
    }
}
