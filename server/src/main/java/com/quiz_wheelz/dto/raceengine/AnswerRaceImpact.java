package com.quiz_wheelz.dto.raceengine;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.quiz_wheelz.enums.Difficulty;
import com.quiz_wheelz.enums.RacePlayerStatus;
import com.quiz_wheelz.enums.RaceStatus;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class AnswerRaceImpact {

    @JsonIgnore
    private Long raceId;

    @JsonIgnore
    private Long racePlayerId;

    private boolean correct;

    private Integer scoreDelta;
    private Double progressDelta;

    private Integer newScore;
    private Double newPosition;
    private Double newSpeed;

    private Integer newStreak;
    private Integer highestStreak;

    @JsonIgnore
    private Integer correctAnswers;

    @JsonIgnore
    private Integer wrongAnswers;

    @JsonIgnore
    private Difficulty answeredDifficulty;

    private Difficulty nextDifficulty;

    @JsonIgnore
    private Integer difficultyCorrectStreak;

    @JsonIgnore
    private Integer difficultyWrongStreak;

    private boolean difficultyChanged;

    private RacePlayerStatus playerStatus;
    private RaceStatus raceStatus;

    private boolean playerFinished;
    private boolean raceFinished;
}
