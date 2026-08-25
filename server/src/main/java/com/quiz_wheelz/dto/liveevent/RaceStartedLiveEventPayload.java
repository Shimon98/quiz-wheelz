package com.quiz_wheelz.dto.liveevent;

import com.quiz_wheelz.dto.teacher.TeacherRaceLivePlayerResponse;
import com.quiz_wheelz.enums.RaceStatus;

import java.util.List;
import java.util.Objects;

public record RaceStartedLiveEventPayload(
        RaceStatus raceStatus,
        Long startedAtEpochMs,
        List<TeacherRaceLivePlayerResponse> players
) implements RaceLiveEventPayload {

    public RaceStartedLiveEventPayload {
        Objects.requireNonNull(raceStatus);
        Objects.requireNonNull(startedAtEpochMs);
        players = List.copyOf(Objects.requireNonNull(players));
    }
}
