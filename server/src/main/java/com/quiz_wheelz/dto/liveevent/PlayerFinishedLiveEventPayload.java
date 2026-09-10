package com.quiz_wheelz.dto.liveevent;

import com.quiz_wheelz.dto.teacher.TeacherRaceLivePlayerResponse;

import java.util.List;
import java.util.Objects;

public record PlayerFinishedLiveEventPayload(
        TeacherRaceLivePlayerResponse player,
        Long finishedAtEpochMs,
        List<TeacherRaceLivePlayerResponse> players
) implements RaceLiveEventPayload {

    public PlayerFinishedLiveEventPayload {
        Objects.requireNonNull(player);
        Objects.requireNonNull(finishedAtEpochMs);
        players = List.copyOf(Objects.requireNonNull(players));
    }
}
