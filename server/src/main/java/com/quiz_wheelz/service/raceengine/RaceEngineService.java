package com.quiz_wheelz.service.raceengine;

import com.quiz_wheelz.dto.raceengine.AnswerRaceImpact;
import com.quiz_wheelz.dto.raceengine.DifficultyProgressionResult;
import com.quiz_wheelz.entitys.Race;
import com.quiz_wheelz.entitys.RacePlayer;
import com.quiz_wheelz.enums.Difficulty;
import com.quiz_wheelz.enums.RacePlayerStatus;
import com.quiz_wheelz.exception.ApiException;
import com.quiz_wheelz.exception.ErrorCode;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RaceEngineService {

    private final ScoringService scoringService;
    private final RaceProgressService raceProgressService;
    private final DifficultyProgressionService difficultyProgressionService;
    private final RaceFinishService raceFinishService;

    public RaceEngineService(
            ScoringService scoringService,
            RaceProgressService raceProgressService,
            DifficultyProgressionService difficultyProgressionService,
            RaceFinishService raceFinishService
    ) {
        this.scoringService = scoringService;
        this.raceProgressService = raceProgressService;
        this.difficultyProgressionService = difficultyProgressionService;
        this.raceFinishService = raceFinishService;
    }

    @Transactional
    public AnswerRaceImpact applyAnswerResult(
            RacePlayer racePlayer,
            boolean correct
    ) {
        validateRacePlayerCanReceiveAnswerImpact(racePlayer);

        Race race = racePlayer.getRace();
        Difficulty answeredDifficulty = difficultyOrDefault(racePlayer.getCurrentDifficulty());

        int scoreDelta = scoringService.calculateScoreDelta(answeredDifficulty, correct);
        double progressDelta = raceProgressService.calculateProgressDelta(
                answeredDifficulty,
                correct
        );
        double newPosition = raceProgressService.calculateNewPosition(
                racePlayer,
                progressDelta
        );
        double newSpeed = raceProgressService.calculateNewSpeed(
                racePlayer,
                answeredDifficulty,
                correct
        );

        racePlayer.setScore(valueOrZero(racePlayer.getScore()) + scoreDelta);
        racePlayer.setPosition(newPosition);
        racePlayer.setSpeed(newSpeed);

        DifficultyProgressionResult difficultyProgression =
                difficultyProgressionService.applyDifficultyProgression(racePlayer, correct);

        boolean playerFinished = raceFinishService.finishPlayerIfNeeded(racePlayer);
        boolean raceFinished = raceFinishService.finishRaceIfNeeded(race);

        return new AnswerRaceImpact(
                race.getId(),
                racePlayer.getId(),
                correct,
                scoreDelta,
                progressDelta,
                racePlayer.getScore(),
                racePlayer.getPosition(),
                racePlayer.getSpeed(),
                racePlayer.getStreak(),
                racePlayer.getHighestStreak(),
                racePlayer.getCorrectAnswers(),
                racePlayer.getWrongAnswers(),
                answeredDifficulty,
                racePlayer.getCurrentDifficulty(),
                racePlayer.getDifficultyCorrectStreak(),
                racePlayer.getDifficultyWrongStreak(),
                difficultyProgression.isDifficultyChanged(),
                racePlayer.getStatus(),
                race.getStatus(),
                playerFinished,
                raceFinished
        );
    }

    private void validateRacePlayerCanReceiveAnswerImpact(RacePlayer racePlayer) {
        if (racePlayer == null) {
            throw new ApiException(ErrorCode.INVALID_ANSWER_SUBMISSION);
        }

        if (racePlayer.getStatus() == RacePlayerStatus.FINISHED
                || racePlayer.getStatus() == RacePlayerStatus.DISCONNECTED) {
            throw new ApiException(ErrorCode.RACE_PLAYER_NOT_RACING);
        }

        Race race = racePlayer.getRace();

        if (race == null) {
            throw new ApiException(ErrorCode.RACE_NOT_FOUND);
        }

        if (race.getTotalDistance() == null) {
            throw new ApiException(ErrorCode.RACE_TOTAL_DISTANCE_MISSING);
        }
    }

    private Difficulty difficultyOrDefault(Difficulty difficulty) {
        return difficulty == null ? Difficulty.EASY : difficulty;
    }

    private int valueOrZero(Integer value) {
        return value == null ? 0 : value;
    }
}
