package com.quiz_wheelz.service.recovery;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class RecoveryStandingTest {
    private final RecoveryPolicy policy = new RecoveryPolicy();

    @Test
    void theStudentCountsInTheLeaderTheMedianAndTheRacerCount() {
        var standing = policy.standing(1000, 320, List.of(480.0, 400.0)).orElseThrow();

        assertEquals(0, standing.self().compareTo(BigDecimal.valueOf(320.0)));
        assertEquals(0, standing.leader().compareTo(BigDecimal.valueOf(480.0)));
        assertEquals(0, standing.median().compareTo(BigDecimal.valueOf(400.0)));
        assertEquals(3, standing.racingPlayers());
    }

    @Test
    void anEvenFieldUsesTheMeanOfTheTwoMiddlePositions() {
        var standing = policy.standing(1000, 100, List.of(300.0, 250.0, 900.0)).orElseThrow();

        assertEquals(0, standing.median().compareTo(new BigDecimal("275")));
        assertEquals(0, standing.leader().compareTo(BigDecimal.valueOf(900.0)));
    }

    @Test
    void theMeanOfTheTwoMiddlePositionsIsExactNotRounded() {
        var standing = policy.standing(1000, 1.0000001, List.of(1.0000002)).orElseThrow();

        assertEquals(0, standing.median().compareTo(new BigDecimal("1.00000015")));
    }

    @Test
    void aPositionThatIsNotAFiniteNumberGivesNoStanding() {
        assertTrue(policy.standing(1000, 100, List.of(Double.NaN)).isEmpty());
        assertTrue(policy.standing(1000, Double.POSITIVE_INFINITY, List.of(200.0)).isEmpty());
        assertTrue(policy.standing(0, 100, List.of(200.0)).isEmpty());
    }
}
