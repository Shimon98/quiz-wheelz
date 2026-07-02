package com.quiz_wheelz.dto.raceengine;

import com.quiz_wheelz.enums.Difficulty;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class DifficultyProgressionResult {

    private Difficulty previousDifficulty;
    private Difficulty nextDifficulty;

    private Integer difficultyCorrectStreak;
    private Integer difficultyWrongStreak;

    private boolean difficultyChanged;
}
