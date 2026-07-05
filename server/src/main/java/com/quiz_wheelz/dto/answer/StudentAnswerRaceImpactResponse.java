package com.quiz_wheelz.dto.answer;

import com.quiz_wheelz.dto.raceengine.AnswerRaceImpact;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.Objects;

@Getter
@AllArgsConstructor
public class StudentAnswerRaceImpactResponse {

    private Integer scoreDelta;
    private Double progressDelta;

    private Integer newScore;
    private Double newPosition;
    private Double newSpeed;

    private Integer streak;
    private Integer highestStreak;

    private String currentDifficulty;
    private boolean difficultyChanged;

    private String playerStatus;
    private String raceStatus;

    private boolean playerFinished;
    private boolean raceFinished;

    public static StudentAnswerRaceImpactResponse from(AnswerRaceImpact impact) {
        Objects.requireNonNull(impact);

        return new StudentAnswerRaceImpactResponse(
                impact.getScoreDelta(),
                impact.getProgressDelta(),
                impact.getNewScore(),
                impact.getNewPosition(),
                impact.getNewSpeed(),
                impact.getNewStreak(),
                impact.getHighestStreak(),
                toName(impact.getNextDifficulty()),
                impact.isDifficultyChanged(),
                toName(impact.getPlayerStatus()),
                toName(impact.getRaceStatus()),
                impact.isPlayerFinished(),
                impact.isRaceFinished()
        );
    }

    private static String toName(Enum<?> value) {
        return value == null ? null : value.name();
    }
}
