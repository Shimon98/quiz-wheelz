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
import com.quiz_wheelz.service.raceengine.RaceMovementCalculator;
import com.quiz_wheelz.service.raceengine.RaceMovementService;
import com.quiz_wheelz.service.raceengine.RacePlayerGameplayTimelineService;
import com.quiz_wheelz.service.raceengine.RaceProgressService;
import com.quiz_wheelz.service.raceengine.ScoringService;
import com.quiz_wheelz.service.raceplayer.RacePlayerGameplayPresenceService.GameplayPresenceDecision;
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
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class QuestionTimeoutChronologyTest {

    private static final Instant ANCHOR = Instant.parse("2026-09-10T10:00:10Z");
    private static final ZoneId ZONE = ZoneId.of("UTC");
    private static final long T10_000 = ANCHOR.toEpochMilli();
    private static final long T10_250 = T10_000 + 250;
    private static final long T10_500 = T10_000 + 500;
    private static final long T11_000 = T10_000 + 1_000;
    private static final long T11_200 = T10_000 + 1_200;

    @Mock
    private PlayerQuestionRepository playerQuestionRepository;

    @Mock
    private RacePlayerRepository racePlayerRepository;

    private RacePlayerGameplayTimelineService timelineService;

    @BeforeEach
    void setUp() {
        Clock clock = Clock.fixed(ANCHOR, ZONE);
        RaceFinishService finishService = new RaceFinishService(racePlayerRepository, clock);
        RaceMovementService movementService = new RaceMovementService(
                new RaceMovementCalculator(),
                finishService,
                playerQuestionRepository,
                clock
        );
        QuestionTimeoutService timeoutService = new QuestionTimeoutService(
                movementService,
                new RaceEngineService(
                        new ScoringService(),
                        new RaceProgressService(),
                        new DifficultyProgressionService(),
                        finishService
                ),
                playerQuestionRepository,
                clock
        );
        timelineService = new RacePlayerGameplayTimelineService(timeoutService, movementService);
    }

    @Test
    void backgroundSettlementBeforeTheDeadlineMustNotApplyTheTimeoutEarly() {
        RacePlayer player = racingPlayer(990.0, 2.0);
        PlayerQuestion question = stubActiveQuestion(player, T10_500);

        timelineService.settleBackground(player, Instant.ofEpochMilli(T11_000), absent(T10_000));

        assertEquals(990.0, player.getPosition(), 1e-9);
        assertEquals(2.0, player.getSpeed(), 1e-9);
        assertEquals(0, player.getWrongAnswers());
        assertEquals(2, player.getStreak());
        assertEquals(PlayerQuestionStatus.ACTIVE, question.getStatus());
        assertEquals(T10_000, player.getMovementUpdatedAtEpochMs());
    }

    @Test
    void laterTrustedTimelineProducesTheSameStateAsProcessingOnceInOrder() {
        RacePlayer viaScheduler = racingPlayer(990.0, 2.0);
        PlayerQuestion schedulerQuestion = stubActiveQuestion(viaScheduler, T10_500);
        timelineService.settleBackground(viaScheduler, Instant.ofEpochMilli(T11_000), absent(T10_000));
        timelineService.settleGameplayRequest(viaScheduler, Instant.ofEpochMilli(T11_200), online(T11_200));

        RacePlayer direct = racingPlayer(990.0, 2.0);
        stubActiveQuestion(direct, T10_500);
        timelineService.settleGameplayRequest(direct, Instant.ofEpochMilli(T11_200), online(T11_200));

        assertEquals(998.48, direct.getPosition(), 1e-9);
        assertEquals(direct.getPosition(), viaScheduler.getPosition(), 1e-9);
        assertEquals(1.6, viaScheduler.getSpeed(), 1e-9);
        assertEquals(direct.getSpeed(), viaScheduler.getSpeed(), 1e-9);
        assertEquals(1, viaScheduler.getWrongAnswers());
        assertEquals(direct.getWrongAnswers(), viaScheduler.getWrongAnswers());
        assertEquals(0, viaScheduler.getStreak());
        assertEquals(direct.getCurrentDifficulty(), viaScheduler.getCurrentDifficulty());
        assertEquals(PlayerQuestionStatus.EXPIRED, schedulerQuestion.getStatus());
        assertEquals(T11_200, viaScheduler.getMovementUpdatedAtEpochMs());
    }

    @Test
    void crossingBeforeTheDeadlineWinsEvenWhenDiscoveredAfterIt() {
        RacePlayer player = racingPlayer(998.0, 2.0);
        PlayerQuestion question = stubActiveQuestion(player, T10_500);

        timelineService.settleBackground(player, Instant.ofEpochMilli(T11_000), absent(T10_000));
        timelineService.settleGameplayRequest(player, Instant.ofEpochMilli(T11_000), online(T11_000));

        assertEquals(RacePlayerStatus.FINISHED, player.getStatus());
        assertEquals(T10_250, player.getFinishedAtEpochMs());
        assertEquals(T10_250, player.getMovementUpdatedAtEpochMs());
        assertEquals(0, player.getWrongAnswers());
        assertEquals(2, player.getStreak());
        assertEquals(0.0, player.getSpeed());
        assertEquals(PlayerQuestionStatus.EXPIRED, question.getStatus());
    }

    @Test
    void reconnectAfterExpiryDuringHiddenGapResolvesTheTimeoutWithoutHiddenMovement() {
        RacePlayer player = racingPlayer(990.0, 2.0);
        PlayerQuestion question = stubActiveQuestion(player, T10_500);

        timelineService.settleReconnect(player, Instant.ofEpochMilli(T11_000), absent(T10_000));

        assertEquals(990.0, player.getPosition(), 1e-9);
        assertEquals(1.6, player.getSpeed(), 1e-9);
        assertEquals(1, player.getWrongAnswers());
        assertEquals(PlayerQuestionStatus.EXPIRED, question.getStatus());
        assertEquals(T11_000, player.getMovementUpdatedAtEpochMs());
        assertEquals(RacePlayerStatus.RACING, player.getStatus());
    }

    @Test
    void reconnectDoesNotResolveAQuestionThatIsStillOpen() {
        RacePlayer player = racingPlayer(990.0, 2.0);
        PlayerQuestion question = stubActiveQuestion(player, T11_200);

        timelineService.settleReconnect(player, Instant.ofEpochMilli(T11_000), absent(T10_000));

        assertEquals(PlayerQuestionStatus.ACTIVE, question.getStatus());
        assertEquals(2.0, player.getSpeed(), 1e-9);
        assertEquals(T11_000, player.getMovementUpdatedAtEpochMs());
    }

    @Test
    void graceExpiryClosesTheQuestionWithoutPenaltyForTheTerminalPlayer() {
        RacePlayer player = racingPlayer(990.0, 2.0);
        PlayerQuestion question = stubActiveQuestion(player, T10_500);

        timelineService.settleBackground(player, Instant.ofEpochMilli(T11_000), graceExpired(T10_000));

        assertEquals(RacePlayerStatus.DISCONNECTED, player.getStatus());
        assertEquals(PlayerQuestionStatus.EXPIRED, question.getStatus());
        assertEquals(990.0, player.getPosition(), 1e-9);
        assertEquals(2.0, player.getSpeed(), 1e-9);
        assertEquals(0, player.getWrongAnswers());
        assertNull(player.getFinishedAtEpochMs());
    }

    @Test
    void raceFinalizationClosesTheQuestionOfTheNormalizedAbsentPlayer() {
        RacePlayer player = racingPlayer(990.0, 2.0);
        PlayerQuestion question = stubActiveQuestion(player, T10_500);

        timelineService.settleForRaceFinalization(player, Instant.ofEpochMilli(T11_000), absent(T10_000));

        assertEquals(RacePlayerStatus.DISCONNECTED, player.getStatus());
        assertEquals(PlayerQuestionStatus.EXPIRED, question.getStatus());
        assertEquals(0, player.getWrongAnswers());
    }

    @Test
    void deadlineInsideTheTrustedSegmentSplitsMovementAtTheDeadline() {
        RacePlayer player = racingPlayer(990.0, 2.0);
        stubActiveQuestion(player, T10_500);

        timelineService.settleBackground(player, Instant.ofEpochMilli(T11_000), absent(T11_000));

        assertEquals(997.2, player.getPosition(), 1e-9);
        assertEquals(1.6, player.getSpeed(), 1e-9);
        assertEquals(1, player.getWrongAnswers());
    }

    private PlayerQuestion stubActiveQuestion(RacePlayer player, long expiresAtEpochMs) {
        PlayerQuestion question = new PlayerQuestion();
        question.setStatus(PlayerQuestionStatus.ACTIVE);
        question.setExpiresAt(LocalDateTime.ofInstant(Instant.ofEpochMilli(expiresAtEpochMs), ZONE));
        when(playerQuestionRepository.findFirstByRacePlayerAndStatusOrderByCreatedAtDesc(
                player,
                PlayerQuestionStatus.ACTIVE
        )).thenAnswer(invocation -> question.getStatus() == PlayerQuestionStatus.ACTIVE
                ? Optional.of(question)
                : Optional.empty());
        lenient().when(playerQuestionRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        return question;
    }

    private GameplayPresenceDecision online(long cutoffEpochMs) {
        return new GameplayPresenceDecision(true, true, false, cutoffEpochMs);
    }

    private GameplayPresenceDecision absent(long cutoffEpochMs) {
        return new GameplayPresenceDecision(true, false, false, cutoffEpochMs);
    }

    private GameplayPresenceDecision graceExpired(long cutoffEpochMs) {
        return new GameplayPresenceDecision(true, false, true, cutoffEpochMs);
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
        player.setMovementUpdatedAtEpochMs(T10_000);
        return player;
    }
}
