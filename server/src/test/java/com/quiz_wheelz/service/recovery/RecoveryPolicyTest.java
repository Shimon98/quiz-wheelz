package com.quiz_wheelz.service.recovery;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class RecoveryPolicyTest {
    private static final double TOTAL = 1000;
    private final RecoveryPolicy policy = new RecoveryPolicy();

    @Test
    void theWindowKeepsTheSixNewestOutcomes() {
        int bits = 0;
        int count = 0;
        for (boolean correct : List.of(false, false, false, false, true, true, true, false, true)) {
            bits = policy.appendOutcome(bits, correct);
            count = policy.nextCount(count);
        }

        assertEquals(6, count);
        assertEquals(2, policy.failures(bits, count));
    }

    @Test
    void theCorrectAnswerThatTriggersTheCheckIsPartOfTheWindow() {
        int bits = window(false, false, false, true, true, true);

        assertEquals(3, policy.failures(bits, 6));
        assertTrue(policy.struggling(bits, 6));
    }

    @Test
    void fiveOutcomesAreNotEnoughEvidenceEvenWhenAllFailed() {
        assertFalse(policy.struggling(window(false, false, false, false, false), 5));
    }

    @Test
    void twoFailuresOutOfSixAreNotStruggling() {
        assertFalse(policy.struggling(window(true, false, true, true, false, true), 6));
    }

    @ParameterizedTest(name = "energy {0} -> {1}")
    @CsvSource({"0, true", "55, true", "90, true", "91, false", "100, false", "-1, false"})
    void theNudgeIsOnlyGivenWhenAllTenPointsFit(int energyAfterNormalGain, boolean room) {
        assertEquals(room, policy.hasRoomForNudge(energyAfterNormalGain));
    }

    @Test
    void theStudentFromTheExampleIsBehindTheLeaderAndTheMedian() {
        assertTrue(policy.behind(standing(320, 480, 400)));
    }

    @ParameterizedTest(name = "self {0}, leader {1}, median player {2} -> {3}")
    @CsvSource({
            "320, 440, 380, true",
            "320, 439, 380, false",
            "320, 480, 380, true",
            "320, 480, 379, false",
            "650, 900, 800, true",
            "651, 900, 800, false",
            "300.25, 420.25, 380, true",
            "300.25, 420.2499, 380, false",
            "300.5, 480, 360.5, true",
            "300.5, 480, 360.4999, false",
            "650.0001, 900, 800, false"})
    void theGapsAndTheProgressCapAreInclusiveBoundaries(double self, double leader, double middle, boolean behind) {
        assertEquals(behind, policy.behind(standing(self, leader, middle)));
    }

    @Test
    void twoRacersTwelvePointsApartAreAlsoSixPointsBehindTheirMedian() {
        var standing = policy.standing(TOTAL, 320, List.of(440.0)).orElseThrow();

        assertEquals(0, standing.median().compareTo(java.math.BigDecimal.valueOf(380.0)));
        assertTrue(policy.behind(standing));
    }

    @Test
    void aStudentRacingAloneIsNeverBehind() {
        assertFalse(policy.behind(policy.standing(TOTAL, 100, List.of()).orElseThrow()));
    }

    @Test
    void theLeaderIsNeverBehind() {
        assertFalse(policy.behind(standing(480, 320, 400)));
    }

    private RecoveryStanding standing(double self, double leader, double middle) {
        return policy.standing(TOTAL, self, List.of(leader, middle)).orElseThrow();
    }

    private int window(boolean... outcomes) {
        int bits = 0;
        for (boolean correct : outcomes) {
            bits = policy.appendOutcome(bits, correct);
        }
        return bits;
    }
}
