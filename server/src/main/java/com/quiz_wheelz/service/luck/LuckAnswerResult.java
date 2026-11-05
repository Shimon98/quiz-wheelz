package com.quiz_wheelz.service.luck;

import com.quiz_wheelz.entitys.RacePlayerLuckDecision;

import java.util.Optional;

// What Luck did with one accepted NORMAL answer: the decision it saved, if it rolled, and whether this answer earned the
// Guard Shield. An answer that earns the shield never rolls, so at most one of the two is set.
public record LuckAnswerResult(Optional<RacePlayerLuckDecision> decision, boolean shieldAwarded) {
    public static final LuckAnswerResult NONE = new LuckAnswerResult(Optional.empty(), false);
}
