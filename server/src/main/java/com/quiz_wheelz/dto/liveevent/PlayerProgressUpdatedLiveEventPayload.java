package com.quiz_wheelz.dto.liveevent;

import com.quiz_wheelz.dto.teacher.TeacherRaceLivePlayerResponse;

import java.util.List;
import java.util.Objects;

public record PlayerProgressUpdatedLiveEventPayload(
        List<TeacherRaceLivePlayerResponse> players
) implements RaceLiveEventPayload {

    public PlayerProgressUpdatedLiveEventPayload {
        players = List.copyOf(Objects.requireNonNull(players));
    }
}
