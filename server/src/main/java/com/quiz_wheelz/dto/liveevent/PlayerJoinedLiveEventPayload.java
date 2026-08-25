package com.quiz_wheelz.dto.liveevent;

import com.quiz_wheelz.dto.teacher.TeacherRaceLivePlayerResponse;

import java.util.Objects;

public record PlayerJoinedLiveEventPayload(
        TeacherRaceLivePlayerResponse player
) implements RaceLiveEventPayload {

    public PlayerJoinedLiveEventPayload {
        Objects.requireNonNull(player);
    }
}
