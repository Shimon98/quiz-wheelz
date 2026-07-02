package com.quiz_wheelz.service.raceengine;

import com.quiz_wheelz.common.DifficultyProgressionRules;
import com.quiz_wheelz.dto.raceengine.DifficultyProgressionResult;
import com.quiz_wheelz.entitys.RacePlayer;
import com.quiz_wheelz.enums.Difficulty;
import org.springframework.stereotype.Service;

@Service
public class DifficultyProgressionService {

    public DifficultyProgressionResult applyDifficultyProgression(
            RacePlayer racePlayer,
            boolean correct
    ) {
        Difficulty previousDifficulty = difficultyOrDefault(racePlayer.getCurrentDifficulty());
        racePlayer.setCurrentDifficulty(previousDifficulty);

        if (correct) {
            return applyCorrectAnswerProgression(racePlayer, previousDifficulty);
        }

        return applyWrongAnswerProgression(racePlayer, previousDifficulty);
    }

    private DifficultyProgressionResult applyCorrectAnswerProgression(
            RacePlayer racePlayer,
            Difficulty previousDifficulty
    ) {
        int streak = valueOrZero(racePlayer.getStreak()) + 1;
        int highestStreak = Math.max(valueOrZero(racePlayer.getHighestStreak()), streak);
        int difficultyCorrectStreak =
                valueOrZero(racePlayer.getDifficultyCorrectStreak()) + 1;

        racePlayer.setCorrectAnswers(valueOrZero(racePlayer.getCorrectAnswers()) + 1);
        racePlayer.setStreak(streak);
        racePlayer.setHighestStreak(highestStreak);
        racePlayer.setDifficultyCorrectStreak(difficultyCorrectStreak);
        racePlayer.setDifficultyWrongStreak(0);

        Difficulty nextDifficulty = nextDifficultyAfterCorrect(
                previousDifficulty,
                difficultyCorrectStreak
        );
        boolean difficultyChanged = nextDifficulty != previousDifficulty;

        if (difficultyChanged) {
            racePlayer.setDifficultyCorrectStreak(0);
            racePlayer.setDifficultyWrongStreak(0);
        }

        racePlayer.setCurrentDifficulty(nextDifficulty);

        return result(previousDifficulty, nextDifficulty, racePlayer, difficultyChanged);
    }

    private DifficultyProgressionResult applyWrongAnswerProgression(
            RacePlayer racePlayer,
            Difficulty previousDifficulty
    ) {
        int difficultyWrongStreak = valueOrZero(racePlayer.getDifficultyWrongStreak()) + 1;

        racePlayer.setWrongAnswers(valueOrZero(racePlayer.getWrongAnswers()) + 1);
        racePlayer.setStreak(0);
        racePlayer.setHighestStreak(valueOrZero(racePlayer.getHighestStreak()));
        racePlayer.setDifficultyCorrectStreak(0);
        racePlayer.setDifficultyWrongStreak(difficultyWrongStreak);

        Difficulty nextDifficulty = nextDifficultyAfterWrong(
                previousDifficulty,
                difficultyWrongStreak
        );
        boolean difficultyChanged = nextDifficulty != previousDifficulty;

        if (difficultyChanged) {
            racePlayer.setDifficultyWrongStreak(0);
            racePlayer.setDifficultyCorrectStreak(recoveryCorrectStreak(previousDifficulty));
        }

        racePlayer.setCurrentDifficulty(nextDifficulty);

        return result(previousDifficulty, nextDifficulty, racePlayer, difficultyChanged);
    }

    private Difficulty nextDifficultyAfterCorrect(
            Difficulty currentDifficulty,
            int difficultyCorrectStreak
    ) {
        return switch (currentDifficulty) {
            case EASY -> difficultyCorrectStreak
                    >= DifficultyProgressionRules.EASY_TO_MEDIUM_CORRECT_STREAK
                    ? Difficulty.MEDIUM
                    : Difficulty.EASY;
            case MEDIUM -> difficultyCorrectStreak
                    >= DifficultyProgressionRules.MEDIUM_TO_HARD_CORRECT_STREAK
                    ? Difficulty.HARD
                    : Difficulty.MEDIUM;
            case HARD -> Difficulty.HARD;
        };
    }

    private Difficulty nextDifficultyAfterWrong(
            Difficulty currentDifficulty,
            int difficultyWrongStreak
    ) {
        if (difficultyWrongStreak < DifficultyProgressionRules.WRONG_STREAK_TO_LEVEL_DOWN) {
            return currentDifficulty;
        }

        return switch (currentDifficulty) {
            case HARD -> Difficulty.MEDIUM;
            case MEDIUM -> Difficulty.EASY;
            case EASY -> Difficulty.EASY;
        };
    }

    private int recoveryCorrectStreak(Difficulty previousDifficulty) {
        return switch (previousDifficulty) {
            case HARD -> DifficultyProgressionRules.RECOVERY_CORRECT_STREAK_AFTER_HARD_TO_MEDIUM;
            case MEDIUM -> DifficultyProgressionRules.RECOVERY_CORRECT_STREAK_AFTER_MEDIUM_TO_EASY;
            case EASY -> 0;
        };
    }

    private DifficultyProgressionResult result(
            Difficulty previousDifficulty,
            Difficulty nextDifficulty,
            RacePlayer racePlayer,
            boolean difficultyChanged
    ) {
        return new DifficultyProgressionResult(
                previousDifficulty,
                nextDifficulty,
                racePlayer.getDifficultyCorrectStreak(),
                racePlayer.getDifficultyWrongStreak(),
                difficultyChanged
        );
    }

    private Difficulty difficultyOrDefault(Difficulty difficulty) {
        return difficulty == null ? Difficulty.EASY : difficulty;
    }

    private int valueOrZero(Integer value) {
        return value == null ? 0 : value;
    }
}
