package com.quiz_wheelz.service.raceengine;

import com.quiz_wheelz.dto.raceengine.DifficultyProgressionResult;
import com.quiz_wheelz.entitys.RacePlayer;
import com.quiz_wheelz.enums.Difficulty;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class DifficultyProgressionServiceTest {

    private final DifficultyProgressionService difficultyProgressionService =
            new DifficultyProgressionService();

    @Test
    void shouldUpdateAnswerCountersAndStreaks() {
        RacePlayer player = player(Difficulty.EASY);
        player.setHighestStreak(4);
        player.setStreak(4);

        difficultyProgressionService.applyDifficultyProgression(player, true);

        assertEquals(1, player.getCorrectAnswers());
        assertEquals(5, player.getStreak());
        assertEquals(5, player.getHighestStreak());

        difficultyProgressionService.applyDifficultyProgression(player, false);

        assertEquals(1, player.getWrongAnswers());
        assertEquals(0, player.getStreak());
        assertEquals(5, player.getHighestStreak());
    }

    @Test
    void shouldMoveFromEasyToMediumAfterThreeCorrectAnswers() {
        RacePlayer player = player(Difficulty.EASY);
        player.setDifficultyCorrectStreak(2);

        DifficultyProgressionResult result =
                difficultyProgressionService.applyDifficultyProgression(player, true);

        assertEquals(Difficulty.MEDIUM, player.getCurrentDifficulty());
        assertEquals(0, player.getDifficultyCorrectStreak());
        assertEquals(0, player.getDifficultyWrongStreak());
        assertTrue(result.isDifficultyChanged());
    }

    @Test
    void shouldNotMoveFromEasyToMediumBeforeThreeCorrectAnswers() {
        RacePlayer player = player(Difficulty.EASY);
        player.setDifficultyCorrectStreak(1);

        DifficultyProgressionResult result =
                difficultyProgressionService.applyDifficultyProgression(player, true);

        assertEquals(Difficulty.EASY, player.getCurrentDifficulty());
        assertEquals(2, player.getDifficultyCorrectStreak());
        assertFalse(result.isDifficultyChanged());
    }

    @Test
    void shouldMoveFromMediumToHardAfterFiveCorrectAnswers() {
        RacePlayer player = player(Difficulty.MEDIUM);
        player.setDifficultyCorrectStreak(4);

        difficultyProgressionService.applyDifficultyProgression(player, true);

        assertEquals(Difficulty.HARD, player.getCurrentDifficulty());
        assertEquals(0, player.getDifficultyCorrectStreak());
        assertEquals(0, player.getDifficultyWrongStreak());
    }

    @Test
    void shouldNotMoveFromMediumToHardBeforeFiveCorrectAnswers() {
        RacePlayer player = player(Difficulty.MEDIUM);
        player.setDifficultyCorrectStreak(3);

        difficultyProgressionService.applyDifficultyProgression(player, true);

        assertEquals(Difficulty.MEDIUM, player.getCurrentDifficulty());
        assertEquals(4, player.getDifficultyCorrectStreak());
    }

    @Test
    void shouldKeepHardAfterCorrectAnswers() {
        RacePlayer player = player(Difficulty.HARD);
        player.setDifficultyCorrectStreak(10);

        difficultyProgressionService.applyDifficultyProgression(player, true);

        assertEquals(Difficulty.HARD, player.getCurrentDifficulty());
        assertEquals(11, player.getDifficultyCorrectStreak());
    }

    @Test
    void shouldNotLowerDifficultyAfterOneWrongAnswer() {
        RacePlayer player = player(Difficulty.HARD);

        difficultyProgressionService.applyDifficultyProgression(player, false);

        assertEquals(Difficulty.HARD, player.getCurrentDifficulty());
        assertEquals(1, player.getDifficultyWrongStreak());
    }

    @Test
    void shouldLowerHardToMediumAfterTwoWrongAnswersWithRecovery() {
        RacePlayer player = player(Difficulty.HARD);
        player.setDifficultyWrongStreak(1);

        difficultyProgressionService.applyDifficultyProgression(player, false);

        assertEquals(Difficulty.MEDIUM, player.getCurrentDifficulty());
        assertEquals(0, player.getDifficultyWrongStreak());
        assertEquals(3, player.getDifficultyCorrectStreak());
    }

    @Test
    void shouldLowerMediumToEasyAfterTwoWrongAnswersWithRecovery() {
        RacePlayer player = player(Difficulty.MEDIUM);
        player.setDifficultyWrongStreak(1);

        difficultyProgressionService.applyDifficultyProgression(player, false);

        assertEquals(Difficulty.EASY, player.getCurrentDifficulty());
        assertEquals(0, player.getDifficultyWrongStreak());
        assertEquals(1, player.getDifficultyCorrectStreak());
    }

    @Test
    void shouldKeepEasyAfterWrongAnswers() {
        RacePlayer player = player(Difficulty.EASY);
        player.setDifficultyWrongStreak(1);

        difficultyProgressionService.applyDifficultyProgression(player, false);

        assertEquals(Difficulty.EASY, player.getCurrentDifficulty());
        assertEquals(2, player.getDifficultyWrongStreak());
        assertEquals(0, player.getDifficultyCorrectStreak());
    }

    @Test
    void shouldTreatNullCurrentDifficultyAsEasy() {
        RacePlayer player = player(null);
        player.setDifficultyCorrectStreak(2);

        DifficultyProgressionResult result =
                difficultyProgressionService.applyDifficultyProgression(player, true);

        assertEquals(Difficulty.EASY, result.getPreviousDifficulty());
        assertEquals(Difficulty.MEDIUM, result.getNextDifficulty());
    }

    private RacePlayer player(Difficulty difficulty) {
        RacePlayer player = new RacePlayer();
        player.setCurrentDifficulty(difficulty);
        player.setCorrectAnswers(0);
        player.setWrongAnswers(0);
        player.setStreak(0);
        player.setHighestStreak(0);
        player.setDifficultyCorrectStreak(0);
        player.setDifficultyWrongStreak(0);

        return player;
    }
}
