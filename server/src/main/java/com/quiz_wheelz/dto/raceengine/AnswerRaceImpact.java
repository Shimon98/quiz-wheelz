package com.quiz_wheelz.dto.raceengine;

import com.quiz_wheelz.enums.Difficulty;
import com.quiz_wheelz.enums.RacePlayerStatus;
import com.quiz_wheelz.enums.RaceStatus;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class AnswerRaceImpact {

    private Long raceId;
    private Long racePlayerId;

    private boolean correct;

    private Integer scoreDelta;
    private Double progressDelta;

    private Integer newScore;
    private Double newPosition;
    private Double newSpeed;

    private Integer newStreak;
    private Integer highestStreak;

    private Integer correctAnswers;
    private Integer wrongAnswers;

    private Difficulty answeredDifficulty;
    private Difficulty nextDifficulty;

    private Integer difficultyCorrectStreak;
    private Integer difficultyWrongStreak;
    private boolean difficultyChanged;

    private RacePlayerStatus playerStatus;
    private RaceStatus raceStatus;

    private boolean playerFinished;
    private boolean raceFinished;
}
