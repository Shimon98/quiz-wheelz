package com.quiz_wheelz.dto.liveevent;

import com.quiz_wheelz.dto.teacher.TeacherRaceLivePlayerResponse;
import com.quiz_wheelz.enums.RaceStatus;

import java.util.List;
import java.util.Objects;

public record RaceFinishedLiveEventPayload(
        RaceStatus raceStatus,
        Long finishedAtEpochMs,
        List<TeacherRaceLivePlayerResponse> players
) implements RaceLiveEventPayload {

    public RaceFinishedLiveEventPayload {
        Objects.requireNonNull(raceStatus);
        Objects.requireNonNull(finishedAtEpochMs);
        players = List.copyOf(Objects.requireNonNull(players));
    }
}
