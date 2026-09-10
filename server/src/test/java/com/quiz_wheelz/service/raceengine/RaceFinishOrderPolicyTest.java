package com.quiz_wheelz.service.raceengine;

import com.quiz_wheelz.entitys.RacePlayer;
import com.quiz_wheelz.enums.RacePlayerStatus;
import com.quiz_wheelz.service.raceengine.RaceFinishOrderPolicy.FinishOrderProof;
import com.quiz_wheelz.service.raceplayer.RaceStandingCalculator;
import org.junit.jupiter.api.Test;

import java.time.ZoneOffset;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class RaceFinishOrderPolicyTest {

    private static final long T = 1_790_000_011_000L;
    private static final int TOTAL_DISTANCE = 1000;

    private final RaceFinishOrderPolicy policy = new RaceFinishOrderPolicy(
            new RaceStandingCalculator(ZoneOffset.UTC),
            new RaceMovementCalculator()
    );

    @Test
    void finishersBeforeEveryRivalsEarliestPossibleCrossingAreConfirmed() {
        RacePlayer first = finished(1L, T - 750);
        RacePlayer second = finished(2L, T - 200);
        RacePlayer racing = racing(3L, 996.0, T - 800);

        FinishOrderProof proof = policy.confirm(List.of(racing, second, first), TOTAL_DISTANCE, T);

        assertEquals(T - 800 + 500 - 1, proof.confirmedThroughEpochMs());
        assertEquals(List.of(1L), ids(proof));
        assertEquals(1, proof.confirmedFinishers().get(0).rank());
    }

    @Test
    void lowerBoundEqualToTheFinishTimeBlocksConfirmation() {
        RacePlayer finisher = finished(1L, T - 300);
        RacePlayer racing = racing(2L, 996.0, T - 800);

        FinishOrderProof proof = policy.confirm(List.of(finisher, racing), TOTAL_DISTANCE, T);

        assertEquals(T - 301, proof.confirmedThroughEpochMs());
        assertTrue(proof.confirmedFinishers().isEmpty());
    }

    @Test
    void finishAtOrAfterDecisionTimeIsNeverConfirmed() {
        RacePlayer atDecision = finished(1L, T);

        FinishOrderProof proof = policy.confirm(List.of(atDecision), TOTAL_DISTANCE, T);

        assertEquals(T - 1, proof.confirmedThroughEpochMs());
        assertTrue(proof.confirmedFinishers().isEmpty());
    }

    @Test
    void sameMillisecondFinishersFormOneConfirmedCohort() {
        RacePlayer a = finished(1L, T - 500);
        RacePlayer b = finished(2L, T - 500);
        RacePlayer later = finished(3L, T - 100);

        FinishOrderProof proof = policy.confirm(List.of(later, b, a), TOTAL_DISTANCE, T);

        assertEquals(List.of(1L, 2L, 3L), ids(proof));
        assertEquals(List.of(1, 1, 3), proof.confirmedFinishers().stream()
                .map(RaceFinishOrderPolicy.ConfirmedFinisher::rank)
                .toList());
    }

    @Test
    void disconnectedRivalsNeverBlockAndFarRacingRivalsRarelyBlock() {
        RacePlayer finisher = finished(1L, T - 100);
        RacePlayer disconnected = racing(2L, 999.0, T - 10_000);
        disconnected.setStatus(RacePlayerStatus.DISCONNECTED);
        RacePlayer far = racing(3L, 100.0, T - 10_000);

        FinishOrderProof proof = policy.confirm(List.of(finisher, disconnected, far), TOTAL_DISTANCE, T);

        assertEquals(List.of(1L), ids(proof));
        assertEquals(T - 1, proof.confirmedThroughEpochMs());
    }

    @Test
    void legacyFinishWithoutEpochBlocksTheWholeProof() {
        RacePlayer precise = finished(1L, T - 500);
        RacePlayer legacy = finished(2L, T - 400);
        legacy.setFinishedAtEpochMs(null);

        FinishOrderProof proof = policy.confirm(List.of(precise, legacy), TOTAL_DISTANCE, T);

        assertNull(proof.confirmedThroughEpochMs());
        assertTrue(proof.confirmedFinishers().isEmpty());
    }

    @Test
    void racingRivalWithoutAnchorOrWaitingPlayerBlocksTheProof() {
        RacePlayer finisher = finished(1L, T - 500);
        RacePlayer noAnchor = racing(2L, 500.0, T - 800);
        noAnchor.setMovementUpdatedAtEpochMs(null);
        RacePlayer waiting = racing(3L, 0.0, T - 800);
        waiting.setStatus(RacePlayerStatus.WAITING);

        assertNull(policy.confirm(List.of(finisher, noAnchor), TOTAL_DISTANCE, T).confirmedThroughEpochMs());
        assertNull(policy.confirm(List.of(finisher, waiting), TOTAL_DISTANCE, T).confirmedThroughEpochMs());
    }

    @Test
    void proofGrowsAsRivalsTimelinesAdvance() {
        RacePlayer finisher = finished(1L, T - 300);
        RacePlayer racing = racing(2L, 996.0, T - 800);

        FinishOrderProof before = policy.confirm(List.of(finisher, racing), TOTAL_DISTANCE, T);
        racing.setPosition(998.0);
        racing.setMovementUpdatedAtEpochMs(T - 200);
        FinishOrderProof after = policy.confirm(List.of(finisher, racing), TOTAL_DISTANCE, T + 500);

        assertTrue(before.confirmedFinishers().isEmpty());
        assertEquals(List.of(1L), ids(after));
        assertEquals(T - 200 + 250 - 1, after.confirmedThroughEpochMs());
    }

    private RacePlayer finished(Long id, long finishedAtEpochMs) {
        RacePlayer player = racing(id, 1000.0, finishedAtEpochMs);
        player.setStatus(RacePlayerStatus.FINISHED);
        player.setFinishedAtEpochMs(finishedAtEpochMs);
        return player;
    }

    private RacePlayer racing(Long id, double position, long anchorEpochMs) {
        RacePlayer player = new RacePlayer();
        player.setId(id);
        player.setLaneNumber(id.intValue());
        player.setStatus(RacePlayerStatus.RACING);
        player.setPosition(position);
        player.setSpeed(1.0);
        player.setMovementUpdatedAtEpochMs(anchorEpochMs);
        return player;
    }

    private List<Long> ids(FinishOrderProof proof) {
        return proof.confirmedFinishers().stream()
                .map(RaceFinishOrderPolicy.ConfirmedFinisher::racePlayerId)
                .toList();
    }
}
