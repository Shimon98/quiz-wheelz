package com.quiz_wheelz.service.luck;

import java.util.List;

public class RaceLuckFairnessPolicy {
    public boolean defer(Candidate current, List<Candidate> peers, Long lastRecipientId,
                         Long lastEventSequence, long instant, long activityWindowMs) {
        if (activityWindowMs <= 0) {
            throw new IllegalArgumentException();
        }
        if (lastEventSequence == null) {
            return false;
        }
        return peers.stream().filter(peer -> peer.playerId() != current.playerId())
                .filter(Candidate::eligible)
                .filter(peer -> peer.lastManualAnswerAt() != null
                        && peer.lastManualAnswerAt() <= instant
                        && peer.lastManualAnswerAt() >= instant - activityWindowMs)
                .filter(peer -> peer.eventsReceived() < current.eventsReceived()
                        || (lastRecipientId != null && lastRecipientId == current.playerId()))
                .anyMatch(peer -> peer.lastRollSequence() == null
                        || peer.lastRollSequence() <= lastEventSequence);
    }

    public record Candidate(long playerId, int eventsReceived, Long lastRollSequence,
                            Long lastManualAnswerAt, boolean eligible) {
    }
}
