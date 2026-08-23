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
        RacePlayer player = racingPlayer(0.0, 1.5);
        PlayerQuestion question = activeQuestionExpiringAfterSeconds(40);

        questionTimeoutService.processExpiredActiveQuestion(
                player,
                question,
                afterSeconds(45)
        );

        assertEquals(262.0, player.getPosition(), 1e-6);
        assertEquals(1.1, player.getSpeed(), 1e-9);
        assertEquals(PlayerQuestionStatus.EXPIRED, question.getStatus());
        assertEquals(afterSeconds(45), player.getMovementUpdatedAtEpochMs());
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

        assertEquals(64.0, player.getPosition(), 1e-6);
        assertEquals(0.6, player.getSpeed(), 1e-9);
        assertEquals(PlayerQuestionStatus.EXPIRED, question.getStatus());
    }

    @Test
    void absentPlayerTimeoutShouldUseWallClockButRespectMovementCutoffExactlyOnce() {
        RacePlayer player = racingPlayer(25.0, 1.0);
        PlayerQuestion question = activeQuestionExpiringAfterSeconds(10);
        LocalDateTime originalExpiresAt = question.getExpiresAt();

        when(playerQuestionRepository.findFirstByRacePlayerAndStatusOrderByCreatedAtDesc(
                player,
                PlayerQuestionStatus.ACTIVE
        )).thenReturn(Optional.of(question));

        questionTimeoutService.settleWithOverdueTimeout(
                player,
                localTimeAfterSeconds(30),
                afterSeconds(30),
                ANCHOR_EPOCH_MS
        );
        questionTimeoutService.settleWithOverdueTimeout(
                player,
                localTimeAfterSeconds(31),
                afterSeconds(31),
                ANCHOR_EPOCH_MS
        );

        assertEquals(25.0, player.getPosition(), 1e-9);
        assertEquals(0.6, player.getSpeed(), 1e-9);
        assertEquals(1, player.getWrongAnswers());
        assertEquals(PlayerQuestionStatus.EXPIRED, question.getStatus());
        assertEquals(originalExpiresAt, question.getExpiresAt());
        assertEquals(ANCHOR_EPOCH_MS, player.getMovementUpdatedAtEpochMs());
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
