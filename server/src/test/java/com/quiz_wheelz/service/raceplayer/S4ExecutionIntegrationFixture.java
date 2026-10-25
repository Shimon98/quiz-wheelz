package com.quiz_wheelz.service.raceplayer;

import java.util.List;

abstract class S4ExecutionIntegrationFixture extends S4ChallengeIntegrationFixture {
    void normalGeneration() {
        allowGeneration();
    }

    List<Object> learning() {
        var player = second();
        return List.of(player.getCurrentDifficulty(), player.getStreak(), player.getHighestStreak(),
                player.getCorrectAnswers(), player.getWrongAnswers(), player.getDifficultyCorrectStreak(),
                player.getDifficultyWrongStreak(), player.getSpeed(), energy());
    }
}
