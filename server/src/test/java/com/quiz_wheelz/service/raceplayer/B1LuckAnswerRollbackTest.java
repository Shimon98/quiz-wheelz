package com.quiz_wheelz.service.raceplayer;

import com.quiz_wheelz.enums.*;
import com.quiz_wheelz.exception.*;
import com.quiz_wheelz.service.luck.LuckEffectResolver;
import org.junit.jupiter.api.Test;
import org.springframework.test.context.bean.override.mockito.MockitoSpyBean;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.*;

class B1LuckAnswerRollbackTest extends B1LuckIntegrationFixture {
    @MockitoSpyBean com.quiz_wheelz.service.luck.LuckPeerJdbcResources resources;
    @MockitoSpyBean LuckEffectResolver resolver;
    @MockitoSpyBean com.quiz_wheelz.service.liveevent.RaceLiveEventRecorder recorder;

    @Test
    void readerAcquisitionFailureRollsBackAcceptedAnswer() throws Exception {
        energy(30);
        doThrow(new java.sql.SQLTransientConnectionException("injected reader acquisition timeout"))
                .when(resources).connection();
        assertThrows(org.springframework.dao.DataAccessResourceFailureException.class, () -> submit(true));
        assertRolledBack(30);
        verifyNoInteractions(random);
    }

    @Test
    void peerQueryFailureAfterSourceReadRollsBackAcceptedAnswer() {
        energy(30);
        doThrow(new org.springframework.dao.DataAccessResourceFailureException("injected peer query timeout",
                new java.sql.SQLTimeoutException())).when(peers).readCommittedPeers(anyLong(), anyLong(), anyLong());
        assertThrows(org.springframework.dao.DataAccessResourceFailureException.class, () -> submit(true));
        assertRolledBack(30);
        assertEquals(0, resources.snapshot().active());
        verifyNoInteractions(random);
    }

    @Test
    void infrastructureFailureAfterEffectWriteRollsBackEntireAcceptedAnswer() {
        energy(30);
        when(random.nextDouble()).thenReturn(0.0);
        doAnswer(call -> {
            call.callRealMethod();
            entityManager.flush();
            throw new IllegalStateException("injected B1 persistence failure");
        }).when(org.springframework.test.util.AopTestUtils.<LuckEffectResolver>getUltimateTargetObject(resolver)).apply(any(), any(), anyLong());
        assertThrows(IllegalStateException.class, () -> submit(true));
        assertRolledBack(30);
    }

    @Test
    void nestedApiOverlapCannotCommitHalfAnswerDespiteOuterNoRollbackFor() {
        energy(30);
        effect(EffectType.SPEED_SLOW, T + 1, T + 4000);
        when(random.nextDouble()).thenReturn(0.0);
        var error = assertThrows(IllegalStateException.class, () -> submit(true));
        assertInstanceOf(ApiException.class, error.getCause());
        assertEquals(ErrorCode.SPEED_EFFECT_OVERLAP, ((ApiException) error.getCause()).getErrorCode());
        assertRolledBack(30);
        assertEquals(1, transactions.execute(status -> effectRepository.findOverlapping(secondId, T, T + 5000).size()).intValue());
    }

    @Test
    void failureAfterShieldAndOfferWritesRollsBackAllAnswerState() {
        energy(80);
        transactions.executeWithoutResult(status -> playerRepository.findById(secondId).orElseThrow().setCorrectAnswers(2));
        var recorderTarget = org.springframework.test.util.AopTestUtils
                .<com.quiz_wheelz.service.liveevent.RaceLiveEventRecorder>getUltimateTargetObject(recorder);
        doAnswer(call -> {
            assertTrue(stateRepository.findByRacePlayerId(secondId).orElseThrow().getGuardShieldGranted());
            assertEquals(0, stateRepository.findByRacePlayerId(secondId).orElseThrow().getChallengeEnergy());
            entityManager.flush();
            throw new org.springframework.dao.DataIntegrityViolationException("injected B1 event failure");
        }).when(recorderTarget).recordQuestionAnswered(any(), anyLong(), anyBoolean());
        assertThrows(org.springframework.dao.DataIntegrityViolationException.class, () -> submit(true));
        assertRolledBack(80);
        assertEquals(2, second().getCorrectAnswers());
        transactions.executeWithoutResult(status -> assertTrue(offerRepository.findUnresolved(secondId).isEmpty()));
        verifyNoInteractions(random);
    }

    @Test
    void databaseConstraintFailureAfterDrawRollsBackWholeAnswer() {
        energy(30);
        when(random.nextDouble()).thenReturn(0.0);
        var resolverTarget = org.springframework.test.util.AopTestUtils
                .<LuckEffectResolver>getUltimateTargetObject(resolver);
        doAnswer(call -> {
            call.callRealMethod();
            entityManager.flush();
            entityManager.createNativeQuery("update race_player_gameplay_states set luck_events_received = 3 where race_player_id = :id")
                    .setParameter("id", secondId).executeUpdate();
            return null;
        }).when(resolverTarget).apply(any(), any(), anyLong());
        assertThrows(RuntimeException.class, () -> submit(true));
        assertRolledBack(30);
    }

    @Test
    void actualAuditUniqueCollisionAfterRecordedEventRollsBackEverything() {
        energy(30);
        when(random.nextDouble()).thenReturn(0.0);
        var target = org.springframework.test.util.AopTestUtils
                .<com.quiz_wheelz.service.liveevent.RaceLiveEventRecorder>getUltimateTargetObject(recorder);
        doAnswer(call -> {
            Object result = call.callRealMethod();
            entityManager.flush();
            assertEquals(1, history().size());
            assertTrue(raceRepository.findById(raceId).orElseThrow().getLiveEventVersion() > 0);
            entityManager.createNativeQuery("""
                    insert into race_player_luck_decisions
                    (race_player_id, source_question_id, decision_sequence, decided_at_epoch_ms,
                     outcome, created_at, updated_at)
                    values (:player, :question, 99, :instant, 'NO_EVENT', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                    """).setParameter("player", secondId).setParameter("question", questionId)
                    .setParameter("instant", T).executeUpdate();
            return result;
        }).when(target).recordQuestionAnswered(any(), anyLong(), anyBoolean());
        RuntimeException failure = assertThrows(RuntimeException.class, () -> submit(true));
        boolean unique = false;
        for (Throwable cause = failure; cause != null; cause = cause.getCause()) {
            if (cause instanceof java.sql.SQLException sql && "23505".equals(sql.getSQLState())) unique = true;
            if (cause instanceof java.sql.SQLException sql && sql.getErrorCode() == 1062) unique = true;
        }
        assertTrue(unique, failure.toString());
        assertRolledBack(30);
        transactions.executeWithoutResult(status -> assertTrue(effectRepository.findOverlapping(secondId, T, T + 5000).isEmpty()));
    }

    void assertRolledBack(int initialEnergy) {
        assertEquals(PlayerQuestionStatus.ACTIVE, question().getStatus());
        assertEquals(100, second().getPosition());
        assertEquals(0, second().getScore());
        assertEquals(initialEnergy, energy());
        assertTrue(history().isEmpty());
        assertEquals(0, gameplay().getLuckRollsTaken());
        assertFalse(gameplay().getGuardShieldGranted());
        transactions.executeWithoutResult(status -> assertTrue(fairnessStates.findByRaceId(raceId).isEmpty()));
        assertTrue(eventTypes().isEmpty());
        assertEquals(0L, race().getLiveEventVersion());
    }
}
