package com.quiz_wheelz.dto.liveevent;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.List;
import java.util.Objects;

// moments (S4-06) are the public gameplay facts this answer caused; teacher clients tell them, students never get them.
// An answer without moments is written exactly as before S4-06 (no "moments" key), so old and new rows read the same.
public record QuestionAnsweredLiveEventPayload(
        Long racePlayerId,
        Long questionId,
        boolean correct,
        @JsonInclude(JsonInclude.Include.NON_EMPTY) List<RacePublicMoment> moments
) implements RaceLiveEventPayload {

    public QuestionAnsweredLiveEventPayload {
        Objects.requireNonNull(racePlayerId);
        Objects.requireNonNull(questionId);
        // Rows written before S4-06 have no "moments" and read back as none; history is never rewritten.
        moments = moments == null ? List.of() : List.copyOf(moments);
    }

    public QuestionAnsweredLiveEventPayload(Long racePlayerId, Long questionId, boolean correct) {
        this(racePlayerId, questionId, correct, List.of());
    }
}
