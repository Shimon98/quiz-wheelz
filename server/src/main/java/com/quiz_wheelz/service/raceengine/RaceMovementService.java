package com.quiz_wheelz.service.raceengine;

import com.quiz_wheelz.common.RaceProgressRules;
import com.quiz_wheelz.entitys.PlayerQuestion;
import com.quiz_wheelz.entitys.Race;
import com.quiz_wheelz.entitys.RacePlayer;
import com.quiz_wheelz.enums.PlayerQuestionStatus;
import com.quiz_wheelz.enums.RacePlayerStatus;
import com.quiz_wheelz.exception.ApiException;
import com.quiz_wheelz.exception.ErrorCode;
import com.quiz_wheelz.repository.PlayerQuestionRepository;
import com.quiz_wheelz.utils.DateTimeUtils;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.util.Objects;
import java.util.Optional;

@Service
public class RaceMovementService {

    private final RaceFinishService raceFinishService;
    private final PlayerQuestionRepository playerQuestionRepository;
    private final Clock clock;

    public RaceMovementService(
            RaceFinishService raceFinishService,
            PlayerQuestionRepository playerQuestionRepository,
            Clock clock
    ) {
        this.raceFinishService = Objects.requireNonNull(raceFinishService);
        this.playerQuestionRepository = Objects.requireNonNull(playerQuestionRepository);
        this.clock = Objects.requireNonNull(clock);
    }

    public boolean settleTo(RacePlayer racePlayer, long targetEpochMs) {
        if (racePlayer == null || racePlayer.getStatus() != RacePlayerStatus.RACING) {
            return false;
        }

        int totalDistance = totalDistanceRequired(racePlayer);
        long anchorEpochMs = resolveAnchor(racePlayer, targetEpochMs);

        if (targetEpochMs <= anchorEpochMs) {
            return false;
        }

        double elapsedSeconds = (targetEpochMs - anchorEpochMs) / 1000.0;
        double speed = racePlayer.getSpeed() == null ? 0.0 : racePlayer.getSpeed();
        double distance =
                elapsedSeconds * speed * RaceProgressRules.BASE_MOVEMENT_UNITS_PER_SECOND;
        double currentPosition =
                racePlayer.getPosition() == null ? 0.0 : racePlayer.getPosition();

        racePlayer.setPosition(Math.min(totalDistance, currentPosition + distance));
        racePlayer.setMovementUpdatedAtEpochMs(targetEpochMs);

        boolean finishedNow = raceFinishService.finishPlayerIfNeeded(racePlayer);

        if (finishedNow) {
            expireLeftoverActiveQuestion(racePlayer);
        }

        return finishedNow;
    }

    public void reanchorAt(RacePlayer racePlayer, long anchorEpochMs) {
        if (racePlayer == null || racePlayer.getStatus() != RacePlayerStatus.RACING) {
            return;
        }

        Long currentAnchor = racePlayer.getMovementUpdatedAtEpochMs();

        if (currentAnchor == null || anchorEpochMs > currentAnchor) {
            racePlayer.setMovementUpdatedAtEpochMs(anchorEpochMs);
        }
    }

    private long resolveAnchor(RacePlayer racePlayer, long targetEpochMs) {
        Long anchorEpochMs = racePlayer.getMovementUpdatedAtEpochMs();

        if (anchorEpochMs != null) {
            return anchorEpochMs;
        }

        long bootstrapAnchor = racePlayer.getStartedAt() != null
                ? DateTimeUtils.toEpochMilli(racePlayer.getStartedAt(), clock.getZone())
                : targetEpochMs;

        racePlayer.setMovementUpdatedAtEpochMs(bootstrapAnchor);

        return bootstrapAnchor;
    }

    private void expireLeftoverActiveQuestion(RacePlayer racePlayer) {
        Optional<PlayerQuestion> activeQuestion = playerQuestionRepository
                .findFirstByRacePlayerAndStatusOrderByCreatedAtDesc(
                        racePlayer,
                        PlayerQuestionStatus.ACTIVE
                );

        activeQuestion.ifPresent(question -> {
            question.setStatus(PlayerQuestionStatus.EXPIRED);
            playerQuestionRepository.save(question);
        });
    }

    private int totalDistanceRequired(RacePlayer racePlayer) {
        Race race = racePlayer.getRace();

        if (race == null || race.getTotalDistance() == null) {
            throw new ApiException(ErrorCode.RACE_TOTAL_DISTANCE_MISSING);
        }

        return race.getTotalDistance();
    }
}
