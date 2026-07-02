package com.quiz_wheelz.service.raceengine;

import com.quiz_wheelz.common.RaceProgressRules;
import com.quiz_wheelz.entitys.Race;
import com.quiz_wheelz.entitys.RacePlayer;
import com.quiz_wheelz.enums.Difficulty;
import com.quiz_wheelz.enums.RacePlayerStatus;
import com.quiz_wheelz.exception.ApiException;
import com.quiz_wheelz.exception.ErrorCode;
import org.springframework.stereotype.Service;

@Service
public class RaceProgressService {

    public double calculateProgressDelta(
            Difficulty answeredDifficulty,
            boolean correct
    ) {
        if (!correct) {
            return RaceProgressRules.WRONG_ANSWER_PROGRESS_DELTA;
        }

        return switch (difficultyOrDefault(answeredDifficulty)) {
            case EASY -> RaceProgressRules.EASY_CORRECT_PROGRESS_DELTA;
            case MEDIUM -> RaceProgressRules.MEDIUM_CORRECT_PROGRESS_DELTA;
            case HARD -> RaceProgressRules.HARD_CORRECT_PROGRESS_DELTA;
        };
    }

    public double calculateNewPosition(
            RacePlayer racePlayer,
            double progressDelta
    ) {
        double currentPosition = racePlayer == null || racePlayer.getPosition() == null
                ? 0.0
                : racePlayer.getPosition();

        double newPosition = currentPosition + progressDelta;
        Integer totalDistance = totalDistanceRequired(racePlayer);

        return Math.min(newPosition, totalDistance.doubleValue());
    }

    public double calculateNewSpeed(
            RacePlayer racePlayer,
            Difficulty answeredDifficulty,
            boolean correct
    ) {
        if (isFinished(racePlayer)) {
            return RaceProgressRules.FINISHED_SPEED;
        }

        if (correct) {
            return switch (difficultyOrDefault(answeredDifficulty)) {
                case EASY -> RaceProgressRules.EASY_CORRECT_SPEED;
                case MEDIUM -> RaceProgressRules.MEDIUM_CORRECT_SPEED;
                case HARD -> RaceProgressRules.HARD_CORRECT_SPEED;
            };
        }

        double currentSpeed = racePlayer == null || racePlayer.getSpeed() == null
                ? 0.0
                : racePlayer.getSpeed();

        return Math.max(
                RaceProgressRules.MIN_RACING_SPEED,
                currentSpeed - RaceProgressRules.WRONG_ANSWER_SPEED_PENALTY
        );
    }

    private Difficulty difficultyOrDefault(Difficulty difficulty) {
        return difficulty == null ? Difficulty.EASY : difficulty;
    }

    private Integer totalDistanceRequired(RacePlayer racePlayer) {
        if (racePlayer == null || racePlayer.getRace() == null) {
            throw new ApiException(ErrorCode.RACE_TOTAL_DISTANCE_MISSING);
        }

        Race race = racePlayer.getRace();

        if (race.getTotalDistance() == null) {
            throw new ApiException(ErrorCode.RACE_TOTAL_DISTANCE_MISSING);
        }

        return race.getTotalDistance();
    }

    private boolean isFinished(RacePlayer racePlayer) {
        return racePlayer != null
                && racePlayer.getStatus() == RacePlayerStatus.FINISHED;
    }
}
