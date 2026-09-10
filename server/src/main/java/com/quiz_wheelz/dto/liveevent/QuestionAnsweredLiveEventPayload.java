package com.quiz_wheelz.dto.liveevent;

import java.util.Objects;

public record QuestionAnsweredLiveEventPayload(
        Long racePlayerId,
        Long questionId,
        boolean correct
) implements RaceLiveEventPayload {

    public QuestionAnsweredLiveEventPayload {
        Objects.requireNonNull(racePlayerId);
        Objects.requireNonNull(questionId);
    }
}
