package com.quiz_wheelz.service.raceplayer;

import com.quiz_wheelz.entitys.RacePlayerChallengeOffer;
import com.quiz_wheelz.enums.*;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class C1FairnessOpportunityTest extends C1RaceAcceptanceFixture {
    @ParameterizedTest
    @ValueSource(ints = {2, 4, 8})
    void everyPeerNoEventOpportunityReleasesRecipientOnALaterManualAnswer(int count) throws Exception {
        observe();
        var ids = newRace(count, 1000);
        primePeers(ids);
        long current = ids.getFirst();
        when(random.nextDouble()).thenReturn(0.0, .5);
        accept(current, false, 0, true);
        clock.set(T + 45000);
        int calls = mockingDetails(random).getInvocations().size();
        accept(current, false, 1, true);
        assertTrue(deferred.contains(current));
        assertEquals(calls, mockingDetails(random).getInvocations().size());
        assertEquals(1, transactions.execute(status -> stateRepository.findByRacePlayerId(current).orElseThrow().getLuckRollsTaken()).intValue());
        when(random.nextDouble()).thenReturn(.6);
        for (long peer : ids.subList(1, ids.size())) accept(peer, false, 2, true);
        when(random.nextDouble()).thenReturn(0.0, .5);
        accept(current, false, 3, true);
        assertFalse(deferred.contains(current));
        assertEquals(2, transactions.execute(status -> stateRepository.findByRacePlayerId(current).orElseThrow().getLuckEventsReceived()).intValue());
        evidence("opportunities-" + count, trace);
    }

    @ParameterizedTest
    @ValueSource(strings = {"AFK", "DISCONNECTED", "CAP", "CHALLENGE", "GATE"})
    void noLongerEligiblePeerCannotKeepLastRecipientDeferred(String reason) throws Exception {
        observe();
        var ids = newRace(2, 1000);
        primePeers(ids);
        long current = ids.getFirst();
        long peer = ids.getLast();
        when(random.nextDouble()).thenReturn(0.0, .5);
        accept(current, false, 0, true);
        clock.set(T + 45000);
        accept(current, false, 1, true);
        assertTrue(deferred.contains(current));
        transactions.executeWithoutResult(status -> {
            var player = playerRepository.findById(peer).orElseThrow();
            var state = stateRepository.findByRacePlayerId(peer).orElseThrow();
            switch (reason) {
                case "AFK" -> state.setLastAcceptedManualNormalAnswerAtEpochMs(T - 15001);
                case "DISCONNECTED" -> player.setStatus(RacePlayerStatus.DISCONNECTED);
                case "CAP" -> state.setLuckEventsReceived(2);
                case "GATE" -> player.setPosition(800.0);
                case "CHALLENGE" -> {
                    var offer = new RacePlayerChallengeOffer();
                    offer.setRacePlayer(player);
                    offer.setOfferedAtEpochMs(clock.millis());
                    offer.setExpiresAtEpochMs(clock.millis() + 12000);
                    entityManager.persist(offer);
                }
                default -> throw new IllegalArgumentException(reason);
            }
        });
        accept(current, false, 2, true);
        assertFalse(deferred.contains(current));
        assertEquals(2, transactions.execute(status -> stateRepository.findByRacePlayerId(current).orElseThrow().getLuckRollsTaken()).intValue());
        evidence("release-" + reason, trace);
    }

    private void primePeers(List<Long> ids) {
        transactions.executeWithoutResult(status -> ids.forEach(id -> stateRepository.findByRacePlayerId(id)
                .orElseThrow().setLastAcceptedManualNormalAnswerAtEpochMs(T)));
    }
}
