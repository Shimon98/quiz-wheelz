package com.quiz_wheelz.service.raceengine;

import com.quiz_wheelz.enums.Difficulty;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class ScoringServiceTest {

    private final ScoringService scoringService = new ScoringService();

    @Test
    void shouldCalculateCorrectAnswerScoreByDifficulty() {
        assertEquals(10, scoringService.calculateScoreDelta(Difficulty.EASY, true));
        assertEquals(15, scoringService.calculateScoreDelta(Difficulty.MEDIUM, true));
        assertEquals(20, scoringService.calculateScoreDelta(Difficulty.HARD, true));
    }

    @Test
    void shouldGiveNoScoreForWrongAnswer() {
        assertEquals(0, scoringService.calculateScoreDelta(Difficulty.HARD, false));
    }

    @Test
    void shouldTreatNullDifficultyAsEasy() {
        assertEquals(10, scoringService.calculateScoreDelta(null, true));
    }
}
