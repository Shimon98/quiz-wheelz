package com.quiz_wheelz.dto.liveevent;

import com.quiz_wheelz.enums.RacePublicMomentKind;

import java.util.Objects;

// One public fact of an answer. sourceId is the server row behind it: the Luck decision, the Challenge offer, or the
// question that earned the Guard Shield.
public record RacePublicMoment(RacePublicMomentKind kind, Long sourceId) {
    public RacePublicMoment {
        Objects.requireNonNull(kind);
        Objects.requireNonNull(sourceId);
    }
}
