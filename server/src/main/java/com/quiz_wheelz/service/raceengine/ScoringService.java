package com.quiz_wheelz.service.raceengine;

import com.quiz_wheelz.common.ScoringRules;
import com.quiz_wheelz.enums.Difficulty;
import org.springframework.stereotype.Service;

@Service
public class ScoringService {

    public int calculateScoreDelta(
            Difficulty answeredDifficulty,
            boolean correct
    ) {
        if (!correct) {
            return ScoringRules.WRONG_ANSWER_SCORE_DELTA;
        }

        return switch (difficultyOrDefault(answeredDifficulty)) {
            case EASY -> ScoringRules.EASY_CORRECT_SCORE_DELTA;
            case MEDIUM -> ScoringRules.MEDIUM_CORRECT_SCORE_DELTA;
            case HARD -> ScoringRules.HARD_CORRECT_SCORE_DELTA;
        };
    }

    private Difficulty difficultyOrDefault(Difficulty difficulty) {
        return difficulty == null ? Difficulty.EASY : difficulty;
    }
}
