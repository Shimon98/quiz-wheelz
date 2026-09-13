package com.quiz_wheelz.service.raceplayer;

import com.quiz_wheelz.entitys.PlayerQuestion;
import com.quiz_wheelz.entitys.Race;
import com.quiz_wheelz.entitys.RacePlayer;
import com.quiz_wheelz.enums.PlayerQuestionStatus;
import com.quiz_wheelz.enums.RacePlayerStatus;
import com.quiz_wheelz.enums.RaceStatus;
import com.quiz_wheelz.repository.PlayerQuestionRepository;
import com.quiz_wheelz.service.question.QuestionTimeoutService;
import com.quiz_wheelz.service.raceengine.RaceMovementCalculator;
import com.quiz_wheelz.service.raceengine.RaceMovementCalculator.Projection;
import com.quiz_wheelz.service.raceengine.RaceMovementService;
import com.quiz_wheelz.service.raceengine.RacePlayerGameplayTimelineService;
import com.quiz_wheelz.service.raceplayer.RacePlayerGameplayPresenceService.GameplayPresenceDecision;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class StudentRaceStandingProjectionServiceTest {

    private static final long DECISION_EPOCH_MS = 1_787_048_000_000L;
    private static final long ANCHOR_EPOCH_MS = DECISION_EPOCH_MS - 1_000L;
    private static final Instant DECISION_INSTANT = Instant.ofEpochMilli(DECISION_EPOCH_MS);

    @Mock
    private RacePlayerGameplayPresenceService gameplayPresenceService;

    @Mock
    private PlayerQuestionRepository playerQuestionRepository;

    private Race race;
    private RacePlayer current;
    private RacePlayer opponent;
    private StudentRaceStandingProjectionService projectionService;

    @BeforeEach
    void setUp() {
        race = new Race();
        race.setId(1L);
        race.setStatus(RaceStatus.IN_PROGRESS);
        race.setTotalDistance(1000);
        current = player(1L, 100.0, 1.0, DECISION_EPOCH_MS);
        opponent = player(2L, 96.0, 1.0, ANCHOR_EPOCH_MS);
        projectionService = new StudentRaceStandingProjectionService(
                gameplayPresenceService,
                new RacePlayerGameplayTimelineService(
                        mock(QuestionTimeoutService.class),
                        mock(RaceMovementService.class)
                ),
                playerQuestionRepository,
                new RaceMovementCalculator(),
                Clock.fixed(DECISION_INSTANT, ZoneOffset.UTC)
        );
    }

    @Test
    void onlineOpponentIsProjectedToTheRequesterDecisionInstant() {
        presence(opponent, true, false, DECISION_EPOCH_MS);
        noActiveQuestions();

        Projection projection = projectAt(List.of(current, opponent)).get(2L);

        assertEquals(100.0, projection.position());
        assertEquals(DECISION_EPOCH_MS, projection.effectiveAtEpochMs());
        assertFalse(projection.crossedFinish());
    }

    @Test
    void absentOpponentStopsAtItsTrustedActivityCutoff() {
        presence(opponent, false, false, DECISION_EPOCH_MS - 600L);
        noActiveQuestions();

        Projection projection = projectAt(List.of(current, opponent)).get(2L);

        assertEquals(97.6, projection.position());
        assertEquals(DECISION_EPOCH_MS - 600L, projection.effectiveAtEpochMs());
    }

    @Test
    void graceExpiredOpponentNeverMovesPastItsCutoffOrBehindItsAnchor() {
        presence(opponent, true, true, ANCHOR_EPOCH_MS - 2_000L);
        noActiveQuestions();

        Projection projection = projectAt(List.of(current, opponent)).get(2L);

        assertEquals(96.0, projection.position());
        assertEquals(ANCHOR_EPOCH_MS, projection.effectiveAtEpochMs());
    }

    @Test
    void degradedPresenceFailsOpenToTheDecisionInstant() {
        when(gameplayPresenceService.resolve(opponent, DECISION_INSTANT))
                .thenReturn(new GameplayPresenceDecision(false, true, false, DECISION_EPOCH_MS));
        noActiveQuestions();

        assertEquals(100.0, projectAt(List.of(current, opponent)).get(2L).position());
    }

    @Test
    void activeQuestionDeadlineCapsTheProjectionAtTheDeadline() {
        presence(opponent, true, false, DECISION_EPOCH_MS);
        when(playerQuestionRepository.findByRacePlayerInAndStatus(
                List.of(opponent),
                PlayerQuestionStatus.ACTIVE
        )).thenReturn(List.of(
                activeQuestion(opponent, DECISION_EPOCH_MS + 5_000L),
                activeQuestion(opponent, DECISION_EPOCH_MS - 500L)
        ));

        Projection projection = projectAt(List.of(current, opponent)).get(2L);

        assertEquals(98.0, projection.position());
        assertEquals(DECISION_EPOCH_MS - 500L, projection.effectiveAtEpochMs());
    }

    @Test
    void deadlineAfterTheDecisionInstantDoesNotCapTheProjection() {
        presence(opponent, true, false, DECISION_EPOCH_MS);
        when(playerQuestionRepository.findByRacePlayerInAndStatus(
                List.of(opponent),
                PlayerQuestionStatus.ACTIVE
        )).thenReturn(List.of(activeQuestion(opponent, DECISION_EPOCH_MS + 1L)));

        assertEquals(100.0, projectAt(List.of(current, opponent)).get(2L).position());
    }

    @Test
    void projectionStopsAtTheDeterministicFinishCrossing() {
        opponent.setPosition(999.0);
        opponent.setSpeed(2.0);
        presence(opponent, true, false, DECISION_EPOCH_MS);
        noActiveQuestions();

        Projection projection = projectAt(List.of(current, opponent)).get(2L);

        assertEquals(1000.0, projection.position());
        assertEquals(ANCHOR_EPOCH_MS + 125L, projection.effectiveAtEpochMs());
        assertTrue(projection.crossedFinish());
        assertEquals(RacePlayerStatus.RACING, opponent.getStatus());
        assertEquals(999.0, opponent.getPosition());
        assertEquals(ANCHOR_EPOCH_MS, opponent.getMovementUpdatedAtEpochMs());
    }

    @Test
    void missingAnchorBootstrapsFromTheRaceStartWithoutMutation() {
        opponent.setMovementUpdatedAtEpochMs(null);
        opponent.setStartedAt(LocalDateTime.ofInstant(
                Instant.ofEpochMilli(ANCHOR_EPOCH_MS),
                ZoneOffset.UTC
        ));
        presence(opponent, true, false, DECISION_EPOCH_MS);
        noActiveQuestions();

        Projection projection = projectAt(List.of(current, opponent)).get(2L);

        assertEquals(100.0, projection.position());
        assertNull(opponent.getMovementUpdatedAtEpochMs());
    }

    @Test
    void currentPlayerAndNonRacingOpponentsAreNeverProjected() {
        RacePlayer finished = player(3L, 1000.0, 0.0, ANCHOR_EPOCH_MS);
        finished.setStatus(RacePlayerStatus.FINISHED);
        RacePlayer disconnected = player(4L, 300.0, 1.0, ANCHOR_EPOCH_MS);
        disconnected.setStatus(RacePlayerStatus.DISCONNECTED);
        RacePlayer waiting = player(5L, 0.0, 0.0, null);
        waiting.setStatus(RacePlayerStatus.WAITING);

        Map<Long, Projection> projections = projectAt(
                List.of(current, finished, disconnected, waiting)
        );

        assertTrue(projections.isEmpty());
        verify(gameplayPresenceService, never()).resolve(any(), any());
        verify(playerQuestionRepository, never()).findByRacePlayerInAndStatus(anyList(), any());
    }

    @Test
    void finishedRaceProjectsNobody() {
        race.setStatus(RaceStatus.FINISHED);

        assertTrue(projectAt(List.of(current, opponent)).isEmpty());
        verify(gameplayPresenceService, never()).resolve(any(), any());
    }

    @Test
    void activeQuestionsOfAllCandidatesAreLoadedInOneBatch() {
        RacePlayer second = player(3L, 50.0, 0.5, ANCHOR_EPOCH_MS);
        presence(opponent, true, false, DECISION_EPOCH_MS);
        presence(second, true, false, DECISION_EPOCH_MS);
        when(playerQuestionRepository.findByRacePlayerInAndStatus(
                List.of(opponent, second),
                PlayerQuestionStatus.ACTIVE
        )).thenReturn(List.of());

        Map<Long, Projection> projections = projectAt(List.of(current, opponent, second));

        assertEquals(100.0, projections.get(2L).position());
        assertEquals(52.0, projections.get(3L).position());
        verify(playerQuestionRepository, times(1)).findByRacePlayerInAndStatus(
                eq(List.of(opponent, second)),
                eq(PlayerQuestionStatus.ACTIVE)
        );
    }

    private Map<Long, Projection> projectAt(List<RacePlayer> racePlayers) {
        return projectionService.projectAt(racePlayers, current.getId(), DECISION_EPOCH_MS);
    }

    private void presence(RacePlayer racePlayer, boolean online, boolean graceExpired, long cutoff) {
        when(gameplayPresenceService.resolve(racePlayer, DECISION_INSTANT))
                .thenReturn(new GameplayPresenceDecision(true, online, graceExpired, cutoff));
    }

    private void noActiveQuestions() {
        when(playerQuestionRepository.findByRacePlayerInAndStatus(anyList(), eq(PlayerQuestionStatus.ACTIVE)))
                .thenReturn(List.of());
    }

    private PlayerQuestion activeQuestion(RacePlayer racePlayer, long expiresAtEpochMs) {
        PlayerQuestion question = new PlayerQuestion();
        question.setRacePlayer(racePlayer);
        question.setStatus(PlayerQuestionStatus.ACTIVE);
        question.setExpiresAt(LocalDateTime.ofInstant(
                Instant.ofEpochMilli(expiresAtEpochMs),
                ZoneOffset.UTC
        ));
        return question;
    }

    private RacePlayer player(Long id, double position, double speed, Long anchorEpochMs) {
        RacePlayer racePlayer = new RacePlayer();
        racePlayer.setId(id);
        racePlayer.setRace(race);
        racePlayer.setStatus(RacePlayerStatus.RACING);
        racePlayer.setPosition(position);
        racePlayer.setSpeed(speed);
        racePlayer.setMovementUpdatedAtEpochMs(anchorEpochMs);
        return racePlayer;
    }
}
