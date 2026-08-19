package com.quiz_wheelz.service.question;

import com.quiz_wheelz.entitys.PlayerQuestion;
import com.quiz_wheelz.entitys.Race;
import com.quiz_wheelz.entitys.RacePlayer;
import com.quiz_wheelz.enums.Difficulty;
import com.quiz_wheelz.enums.PlayerQuestionStatus;
import com.quiz_wheelz.enums.RacePlayerStatus;
import com.quiz_wheelz.enums.RaceStatus;
import com.quiz_wheelz.repository.PlayerQuestionRepository;
import com.quiz_wheelz.repository.RacePlayerRepository;
import com.quiz_wheelz.service.raceengine.DifficultyProgressionService;
import com.quiz_wheelz.service.raceengine.RaceEngineService;
import com.quiz_wheelz.service.raceengine.RaceFinishService;
import com.quiz_wheelz.service.raceengine.RaceMovementService;
import com.quiz_wheelz.service.raceengine.RaceProgressService;
import com.quiz_wheelz.service.raceengine.ScoringService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.when;

/*
 * Deliberately wired with the REAL movement/engine services (repositories
 * mocked): the chronology contract — old speed owns pre-deadline time, the
 * penalized speed owns post-deadline time — is exactly the interaction these
 * pieces must get right together.
 */
@ExtendWith(MockitoExtension.class)
class QuestionTimeoutServiceTest {

    private static final Instant ANCHOR_INSTANT = Instant.parse("2026-08-19T10:00:00Z");
    private static final ZoneId FIXED_ZONE = ZoneId.of("UTC");
    private static final long ANCHOR_EPOCH_MS = ANCHOR_INSTANT.toEpochMilli();

    @Mock
    private PlayerQuestionRepository playerQuestionRepository;

    @Mock
    private RacePlayerRepository racePlayerRepository;

    private QuestionTimeoutService questionTimeoutService;

    @BeforeEach
    void setUp() {
        Clock fixedClock = Clock.fixed(ANCHOR_INSTANT, FIXED_ZONE);
        RaceFinishService raceFinishService =
                new RaceFinishService(racePlayerRepository, fixedClock);

        questionTimeoutService = new QuestionTimeoutService(
                new RaceMovementService(
                        raceFinishService,
                        playerQuestionRepository,
                        fixedClock
                ),
                new RaceEngineService(
                        new ScoringService(),
                        new RaceProgressService(),
                        new DifficultyProgressionService(),
                        raceFinishService
                ),
                playerQuestionRepository,
                fixedClock
        );
    }

    @Test
    void shouldSettleAroundDeadlineWithChronologicallyCorrectSpeeds() {
        // Expires 40s after the anchor, processed 45s after it.
        RacePlayer player = racingPlayer(0.0, 1.5);
        PlayerQuestion question = activeQuestionExpiringAfterSeconds(40);

        questionTimeoutService.processExpiredActiveQuestion(
                player,
                question,
                afterSeconds(45)
        );

        // 40s x 1.5 x 4 = 240 at the OLD speed, then the timeout penalty
        // (1.5 - 0.4 = 1.1), then 5s x 1.1 x 4 = 22 at the NEW speed.
        assertEquals(262.0, player.getPosition(), 1e-6);
        assertEquals(1.1, player.getSpeed(), 1e-9);
        assertEquals(PlayerQuestionStatus.EXPIRED, question.getStatus());
        assertEquals(afterSeconds(45), player.getMovementUpdatedAtEpochMs());
        // Timeout counts as a failure: streak reset + wrong counter.
        assertEquals(0, player.getStreak());
        assertEquals(1, player.getWrongAnswers());
    }

    @Test
    void shouldApplyTimeoutExactlyOnce() {
        RacePlayer player = racingPlayer(0.0, 1.5);
        PlayerQuestion question = activeQuestionExpiringAfterSeconds(40);

        questionTimeoutService.processExpiredActiveQuestion(
                player,
                question,
                afterSeconds(45)
        );
        // A second discoverer (concurrent resolve / late answer) sees the
        // EXPIRED transition and must not penalize again.
        questionTimeoutService.processExpiredActiveQuestion(
                player,
                question,
                afterSeconds(46)
        );

        assertEquals(1.1, player.getSpeed(), 1e-9);
        assertEquals(1, player.getWrongAnswers());
    }

    @Test
    void shouldLetFinishWinOverTimeoutPenalty() {
        // 40s at 1.5 = 240 units — far past the 10 remaining: the player
        // crosses the line BEFORE the deadline penalty could apply.
        RacePlayer player = racingPlayer(990.0, 1.5);
        PlayerQuestion question = activeQuestionExpiringAfterSeconds(40);

        questionTimeoutService.processExpiredActiveQuestion(
                player,
                question,
                afterSeconds(45)
        );

        assertEquals(RacePlayerStatus.FINISHED, player.getStatus());
        assertEquals(1000.0, player.getPosition(), 1e-9);
        assertEquals(0.0, player.getSpeed());
        // No penalty after the finish line.
        assertEquals(0, player.getWrongAnswers());
        assertEquals(PlayerQuestionStatus.EXPIRED, question.getStatus());
    }

    @Test
    void settleWithOverdueTimeoutShouldOnlySettleWhenQuestionIsStillActive() {
        RacePlayer player = racingPlayer(0.0, 1.0);
        PlayerQuestion question = activeQuestionExpiringAfterSeconds(60);

        when(playerQuestionRepository.findFirstByRacePlayerAndStatusOrderByCreatedAtDesc(
                player,
                PlayerQuestionStatus.ACTIVE
        )).thenReturn(Optional.of(question));

        questionTimeoutService.settleWithOverdueTimeout(
                player,
                localTimeAfterSeconds(10),
                afterSeconds(10)
        );

        // Unexpired question → plain settlement, no penalty.
        assertEquals(40.0, player.getPosition(), 1e-9);
        assertEquals(1.0, player.getSpeed(), 1e-9);
        assertEquals(PlayerQuestionStatus.ACTIVE, question.getStatus());
    }

    @Test
    void settleWithOverdueTimeoutShouldProcessOverdueQuestion() {
        RacePlayer player = racingPlayer(0.0, 1.0);
        PlayerQuestion question = activeQuestionExpiringAfterSeconds(10);

        when(playerQuestionRepository.findFirstByRacePlayerAndStatusOrderByCreatedAtDesc(
                player,
                PlayerQuestionStatus.ACTIVE
        )).thenReturn(Optional.of(question));

        questionTimeoutService.settleWithOverdueTimeout(
                player,
                localTimeAfterSeconds(20),
                afterSeconds(20)
        );

        // 10s x 1.0 x 4 = 40, penalty (1.0 - 0.4 = 0.6), 10s x 0.6 x 4 = 24.
        assertEquals(64.0, player.getPosition(), 1e-6);
        assertEquals(0.6, player.getSpeed(), 1e-9);
        assertEquals(PlayerQuestionStatus.EXPIRED, question.getStatus());
    }

    private RacePlayer racingPlayer(double position, double speed) {
        Race race = new Race();
        race.setStatus(RaceStatus.IN_PROGRESS);
        race.setTotalDistance(1000);

        RacePlayer player = new RacePlayer();
        player.setRace(race);
        player.setStatus(RacePlayerStatus.RACING);
        player.setPosition(position);
        player.setSpeed(speed);
        player.setStreak(2);
        player.setHighestStreak(2);
        player.setWrongAnswers(0);
        player.setCorrectAnswers(2);
        player.setCurrentDifficulty(Difficulty.EASY);
        player.setDifficultyCorrectStreak(2);
        player.setDifficultyWrongStreak(0);
        player.setMovementUpdatedAtEpochMs(ANCHOR_EPOCH_MS);

        return player;
    }

    private PlayerQuestion activeQuestionExpiringAfterSeconds(long seconds) {
        PlayerQuestion question = new PlayerQuestion();
        question.setStatus(PlayerQuestionStatus.ACTIVE);
        question.setExpiresAt(localTimeAfterSeconds(seconds));

        return question;
    }

    private LocalDateTime localTimeAfterSeconds(long seconds) {
        return LocalDateTime.ofInstant(
                ANCHOR_INSTANT.plusSeconds(seconds),
                FIXED_ZONE
        );
    }

    private long afterSeconds(long seconds) {
        return ANCHOR_EPOCH_MS + seconds * 1000;
    }
}
