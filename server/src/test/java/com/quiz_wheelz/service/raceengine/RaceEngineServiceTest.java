package com.quiz_wheelz.service.raceengine;

import com.quiz_wheelz.dto.raceengine.AnswerRaceImpact;
import com.quiz_wheelz.entitys.Race;
import com.quiz_wheelz.entitys.RacePlayer;
import com.quiz_wheelz.enums.Difficulty;
import com.quiz_wheelz.enums.RacePlayerStatus;
import com.quiz_wheelz.enums.RaceStatus;
import com.quiz_wheelz.exception.ApiException;
import com.quiz_wheelz.exception.ErrorCode;
import com.quiz_wheelz.repository.RacePlayerRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RaceEngineServiceTest {

    private static final long DECISION_EPOCH_MS = 1_787_045_370_000L;

    @Mock
    private RacePlayerRepository racePlayerRepository;

    private RaceEngineService raceEngineService;

    @BeforeEach
    void setUp() {
        RaceFinishService raceFinishService = new RaceFinishService(racePlayerRepository, java.time.Clock.systemUTC());

        raceEngineService = new RaceEngineService(
                new ScoringService(),
                new RaceProgressService(),
                new DifficultyProgressionService(),
                raceFinishService
        );
    }

    @Test
    void shouldApplyCorrectEasyAnswerImpact() {
        Race race = race(100, RaceStatus.IN_PROGRESS);
        RacePlayer player = player(10L, race, Difficulty.EASY, 0.0, 0.5);

        when(racePlayerRepository.findByRaceOrderByLaneNumberAsc(race))
                .thenReturn(List.of(player));

        AnswerRaceImpact impact = raceEngineService.applyAnswerResult(player, true, DECISION_EPOCH_MS);

        assertEquals(10, player.getScore());
        assertEquals(10.0, player.getPosition());
        assertEquals(0.7, player.getSpeed(), 1e-9);
        assertEquals(1, player.getStreak());
        assertEquals(1, player.getHighestStreak());
        assertEquals(1, player.getCorrectAnswers());
        assertEquals(0, player.getWrongAnswers());
        assertEquals(Difficulty.EASY, impact.getAnsweredDifficulty());
        assertEquals(Difficulty.EASY, impact.getNextDifficulty());
        assertFalse(impact.isPlayerFinished());
    }

    @Test
    void shouldUseMediumScoringBeforeDifficultyChanges() {
        Race race = race(100, RaceStatus.IN_PROGRESS);
        RacePlayer player = player(10L, race, Difficulty.MEDIUM, 0.0, 0.0);
        player.setDifficultyCorrectStreak(4);

        when(racePlayerRepository.findByRaceOrderByLaneNumberAsc(race))
                .thenReturn(List.of(player));

        AnswerRaceImpact impact = raceEngineService.applyAnswerResult(player, true, DECISION_EPOCH_MS);

        assertEquals(15, impact.getScoreDelta());
        assertEquals(15.0, impact.getProgressDelta());
        assertEquals(Difficulty.MEDIUM, impact.getAnsweredDifficulty());
        assertEquals(Difficulty.HARD, impact.getNextDifficulty());
        assertTrue(impact.isDifficultyChanged());
    }

    @Test
    void shouldUseHardScoringAndProgress() {
        Race race = race(100, RaceStatus.IN_PROGRESS);
        RacePlayer player = player(10L, race, Difficulty.HARD, 0.0, 1.7);

        when(racePlayerRepository.findByRaceOrderByLaneNumberAsc(race))
                .thenReturn(List.of(player));

        AnswerRaceImpact impact = raceEngineService.applyAnswerResult(player, true, DECISION_EPOCH_MS);

        assertEquals(20, impact.getScoreDelta());
        assertEquals(20.0, impact.getProgressDelta());
        assertEquals(2.0, impact.getNewSpeed());
    }

    @Test
    void shouldApplyWrongAnswerImpact() {
        Race race = race(100, RaceStatus.IN_PROGRESS);
        RacePlayer player = player(10L, race, Difficulty.MEDIUM, 30.0, 1.5);
        player.setScore(25);
        player.setStreak(3);
        player.setHighestStreak(3);

        when(racePlayerRepository.findByRaceOrderByLaneNumberAsc(race))
                .thenReturn(List.of(player));

        AnswerRaceImpact impact = raceEngineService.applyAnswerResult(player, false, DECISION_EPOCH_MS);

        assertEquals(0, impact.getScoreDelta());
        assertEquals(0.0, impact.getProgressDelta());
        assertEquals(25, player.getScore());
        assertEquals(30.0, player.getPosition());
        assertEquals(1.3, player.getSpeed(), 1e-9);
        assertEquals(0, player.getStreak());
        assertEquals(1, player.getWrongAnswers());
    }

    @Test
    void shouldFinishPlayerWhenPositionReachesTotalDistance() {
        Race race = race(100, RaceStatus.IN_PROGRESS);
        RacePlayer player = player(10L, race, Difficulty.HARD, 90.0, 1.0);

        when(racePlayerRepository.findByRaceOrderByLaneNumberAsc(race))
                .thenReturn(List.of(player));

        AnswerRaceImpact impact = raceEngineService.applyAnswerResult(player, true, DECISION_EPOCH_MS);

        assertTrue(impact.isPlayerFinished());
        assertEquals(RacePlayerStatus.FINISHED, player.getStatus());
        assertEquals(100.0, player.getPosition());
        assertEquals(0.0, player.getSpeed());
    }

    @Test
    void finishingAnswerStampsTheAnswerDecisionInstantAsTheFinishTime() {
        Race race = race(100, RaceStatus.IN_PROGRESS);
        RacePlayer player = player(10L, race, Difficulty.HARD, 90.0, 1.0);

        when(racePlayerRepository.findByRaceOrderByLaneNumberAsc(race))
                .thenReturn(List.of(player));

        raceEngineService.applyAnswerResult(player, true, DECISION_EPOCH_MS);

        assertEquals(DECISION_EPOCH_MS, player.getFinishedAtEpochMs());
        assertEquals(RacePlayerStatus.FINISHED, player.getStatus());
    }

    @Test
    void shouldFinishRaceWhenAllPlayersAreFinishedOrDisconnected() {
        Race race = race(100, RaceStatus.IN_PROGRESS);
        RacePlayer player = player(10L, race, Difficulty.HARD, 90.0, 1.0);
        RacePlayer disconnected = player(11L, race, Difficulty.EASY, 20.0, 0.0);
        disconnected.setStatus(RacePlayerStatus.DISCONNECTED);

        when(racePlayerRepository.findByRaceOrderByLaneNumberAsc(race))
                .thenReturn(List.of(player, disconnected));

        AnswerRaceImpact impact = raceEngineService.applyAnswerResult(player, true, DECISION_EPOCH_MS);

        assertTrue(impact.isRaceFinished());
        assertEquals(RaceStatus.FINISHED, race.getStatus());
    }

    @Test
    void shouldNotFinishRaceWhenAnotherPlayerIsStillRacing() {
        Race race = race(100, RaceStatus.IN_PROGRESS);
        RacePlayer player = player(10L, race, Difficulty.HARD, 90.0, 1.0);
        RacePlayer otherPlayer = player(11L, race, Difficulty.EASY, 20.0, 1.0);

        when(racePlayerRepository.findByRaceOrderByLaneNumberAsc(race))
                .thenReturn(List.of(player, otherPlayer));

        AnswerRaceImpact impact = raceEngineService.applyAnswerResult(player, true, DECISION_EPOCH_MS);

        assertFalse(impact.isRaceFinished());
        assertEquals(RaceStatus.IN_PROGRESS, race.getStatus());
    }

    @Test
    void shouldRejectFinishedPlayer() {
        Race race = race(100, RaceStatus.IN_PROGRESS);
        RacePlayer player = player(10L, race, Difficulty.EASY, 100.0, 0.0);
        player.setStatus(RacePlayerStatus.FINISHED);

        ApiException exception = assertThrows(
                ApiException.class,
                () -> raceEngineService.applyAnswerResult(player, true, DECISION_EPOCH_MS)
        );

        assertEquals(ErrorCode.RACE_PLAYER_NOT_RACING, exception.getErrorCode());
    }

    @Test
    void shouldRejectDisconnectedPlayer() {
        Race race = race(100, RaceStatus.IN_PROGRESS);
        RacePlayer player = player(10L, race, Difficulty.EASY, 20.0, 0.0);
        player.setStatus(RacePlayerStatus.DISCONNECTED);

        ApiException exception = assertThrows(
                ApiException.class,
                () -> raceEngineService.applyAnswerResult(player, true, DECISION_EPOCH_MS)
        );

        assertEquals(ErrorCode.RACE_PLAYER_NOT_RACING, exception.getErrorCode());
    }

    @Test
    void shouldRejectWaitingPlayer() {
        Race race = race(100, RaceStatus.IN_PROGRESS);
        RacePlayer player = player(10L, race, Difficulty.EASY, 0.0, 0.0);
        player.setStatus(RacePlayerStatus.WAITING);

        ApiException exception = assertThrows(
                ApiException.class,
                () -> raceEngineService.applyAnswerResult(player, true, DECISION_EPOCH_MS)
        );

        assertEquals(ErrorCode.RACE_PLAYER_NOT_RACING, exception.getErrorCode());
    }

    @Test
    void shouldRejectRaceWhenRaceIsNotInProgress() {
        Race race = race(100, RaceStatus.READY);
        RacePlayer player = player(10L, race, Difficulty.EASY, 0.0, 0.0);

        ApiException exception = assertThrows(
                ApiException.class,
                () -> raceEngineService.applyAnswerResult(player, true, DECISION_EPOCH_MS)
        );

        assertEquals(ErrorCode.RACE_NOT_IN_PROGRESS, exception.getErrorCode());
    }

    @Test
    void shouldRejectRacePlayerWhenRaceTotalDistanceIsMissing() {
        Race race = race(null, RaceStatus.IN_PROGRESS);
        RacePlayer player = player(10L, race, Difficulty.EASY, 0.0, 0.0);

        ApiException exception = assertThrows(
                ApiException.class,
                () -> raceEngineService.applyAnswerResult(player, true, DECISION_EPOCH_MS)
        );

        assertEquals(ErrorCode.RACE_TOTAL_DISTANCE_MISSING, exception.getErrorCode());
    }

    @Test
    void shouldRecoverFromHardToMediumLevelDownAfterTwoCorrectMediumAnswers() {
        Race race = race(1000, RaceStatus.IN_PROGRESS);
        RacePlayer player = player(10L, race, Difficulty.HARD, 0.0, 1.0);
        player.setDifficultyWrongStreak(1);

        when(racePlayerRepository.findByRaceOrderByLaneNumberAsc(race))
                .thenReturn(List.of(player));

        raceEngineService.applyAnswerResult(player, false, DECISION_EPOCH_MS);
        assertEquals(Difficulty.MEDIUM, player.getCurrentDifficulty());
        assertEquals(3, player.getDifficultyCorrectStreak());

        raceEngineService.applyAnswerResult(player, true, DECISION_EPOCH_MS);
        assertEquals(Difficulty.MEDIUM, player.getCurrentDifficulty());

        raceEngineService.applyAnswerResult(player, true, DECISION_EPOCH_MS);
        assertEquals(Difficulty.HARD, player.getCurrentDifficulty());
    }

    @Test
    void shouldRecoverFromMediumToEasyLevelDownAfterTwoCorrectEasyAnswers() {
        Race race = race(1000, RaceStatus.IN_PROGRESS);
        RacePlayer player = player(10L, race, Difficulty.MEDIUM, 0.0, 1.0);
        player.setDifficultyWrongStreak(1);

        when(racePlayerRepository.findByRaceOrderByLaneNumberAsc(race))
                .thenReturn(List.of(player));

        raceEngineService.applyAnswerResult(player, false, DECISION_EPOCH_MS);
        assertEquals(Difficulty.EASY, player.getCurrentDifficulty());
        assertEquals(1, player.getDifficultyCorrectStreak());

        raceEngineService.applyAnswerResult(player, true, DECISION_EPOCH_MS);
        assertEquals(Difficulty.EASY, player.getCurrentDifficulty());

        raceEngineService.applyAnswerResult(player, true, DECISION_EPOCH_MS);
        assertEquals(Difficulty.MEDIUM, player.getCurrentDifficulty());
    }

    private Race race(Integer totalDistance, RaceStatus status) {
        Race race = new Race();
        race.setId(1L);
        race.setTotalDistance(totalDistance);
        race.setStatus(status);

        return race;
    }

    private RacePlayer player(
            Long id,
            Race race,
            Difficulty difficulty,
            Double position,
            Double speed
    ) {
        RacePlayer player = new RacePlayer();
        player.setId(id);
        player.setRace(race);
        player.setStatus(RacePlayerStatus.RACING);
        player.setCurrentDifficulty(difficulty);
        player.setPosition(position);
        player.setSpeed(speed);
        player.setScore(0);
        player.setStreak(0);
        player.setHighestStreak(0);
        player.setCorrectAnswers(0);
        player.setWrongAnswers(0);
        player.setDifficultyCorrectStreak(0);
        player.setDifficultyWrongStreak(0);

        return player;
    }
}
