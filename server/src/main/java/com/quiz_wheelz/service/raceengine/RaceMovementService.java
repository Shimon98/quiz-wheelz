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

/**
 * The ONE owner of authoritative time-based movement (C1-03M): settles a
 * RACING player's position from its movement anchor to a target instant
 * using the speed that was valid during that interval. Callers must hold
 * the RacePlayer PESSIMISTIC_WRITE lock; the advancing anchor makes
 * overlapping settlers (request + scheduler, two dev servers) idempotent —
 * the same elapsed time can never be counted twice.
 *
 * Chronology contract: settle FIRST, then change speed — the old speed owns
 * past time, a new boost/penalty owns only the future. Question/HTTP/score
 * logic never lives here; the only question concern is expiring a leftover
 * ACTIVE question when settlement itself crosses the finish line (no other
 * owner runs for a FINISHED player).
 */
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

    /**
     * @return true when THIS settlement crossed the finish line (the player
     *         just became FINISHED); false for no-ops and ordinary movement.
     */
    public boolean settleTo(RacePlayer racePlayer, long targetEpochMs) {
        if (racePlayer == null || racePlayer.getStatus() != RacePlayerStatus.RACING) {
            return false;
        }

        int totalDistance = totalDistanceRequired(racePlayer);
        long anchorEpochMs = resolveAnchor(racePlayer, targetEpochMs);

        if (targetEpochMs <= anchorEpochMs) {
            // Backward/zero time is never movement — keep the later anchor.
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

    private long resolveAnchor(RacePlayer racePlayer, long targetEpochMs) {
        Long anchorEpochMs = racePlayer.getMovementUpdatedAtEpochMs();

        if (anchorEpochMs != null) {
            return anchorEpochMs;
        }

        // Legacy RACING row from before the anchor existed: startedAt is the
        // honest start of movement; with no trustworthy start, anchor at the
        // target — never invent a huge historical elapsed interval.
        long bootstrapAnchor = racePlayer.getStartedAt() != null
                ? DateTimeUtils.toEpochMilli(racePlayer.getStartedAt(), clock.getZone())
                : targetEpochMs;

        racePlayer.setMovementUpdatedAtEpochMs(bootstrapAnchor);

        return bootstrapAnchor;
    }

    /*
     * A player finished by pure time movement still owns an ACTIVE question
     * row; no delivery/answer path will ever touch it again (both reject
     * non-RACING players), so it would live forever without this.
     */
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
