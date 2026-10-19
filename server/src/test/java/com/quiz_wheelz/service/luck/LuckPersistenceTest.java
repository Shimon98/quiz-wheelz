package com.quiz_wheelz.service.luck;

import com.quiz_wheelz.entitys.*;
import com.quiz_wheelz.enums.*;
import com.quiz_wheelz.repository.*;
import com.quiz_wheelz.service.raceplayer.RacePlayerGameplayStateService;
import jakarta.persistence.EntityManager;
import jakarta.persistence.LockModeType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;
import java.time.LocalDateTime;
import java.util.concurrent.atomic.AtomicInteger;
import static org.junit.jupiter.api.Assertions.*;

@org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase(replace = org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase.Replace.NONE)
@DataJpaTest(showSql = false)
@ActiveProfiles("test")
@Import({com.quiz_wheelz.support.LuckDatabaseConfiguration.class, RacePlayerGameplayStateService.class, RaceLuckFairnessStateService.class, LuckTransactionGuard.class})
@Transactional(propagation = Propagation.NOT_SUPPORTED)
class LuckPersistenceTest {
    private static final AtomicInteger SEQUENCE = new AtomicInteger();
    @Autowired EntityManager em;
    @Autowired PlatformTransactionManager manager;
    @Autowired RacePlayerGameplayStateService states;
    @Autowired RaceLuckFairnessStateRepository fairness;
    @Autowired RaceLuckFairnessStateService fairnessOwner;
    @Autowired RacePlayerLuckDecisionRepository decisions;
    @Autowired RacePlayerGameplayStateRepository gameplay;
    protected TransactionTemplate tx;
    protected Long raceId;
    protected Long playerId;
    protected Long questionId;

    @BeforeEach
    void prepare() {
        tx = new TransactionTemplate(manager);
        tx.executeWithoutResult(status -> {
            com.quiz_wheelz.support.LuckDatabaseEvidence.verify(em);
            String key = "L" + SEQUENCE.incrementAndGet();
            var teacher = new User();
            teacher.setUsername("luck-" + key);
            teacher.setDisplayName("Teacher");
            em.persist(teacher);
            var subject = new Subject();
            subject.setCode(key);
            subject.setName(key);
            em.persist(subject);
            var race = new Race();
            race.setTeacher(teacher);
            race.setSubject(subject);
            race.setRoomCode(key);
            race.setTitle("Luck test");
            race.setMaxPlayers(8);
            race.setTotalDistance(1000);
            em.persist(race);
            raceId = race.getId();
            var player = new RacePlayer();
            player.setRace(race);
            player.setDisplayName("Student");
            player.setLaneNumber(1);
            em.persist(player);
            playerId = player.getId();
            var template = new QuestionTemplate();
            template.setSubject(subject);
            template.setType(QuestionType.ADDITION);
            template.setDifficulty(Difficulty.EASY);
            template.setMinValue(0);
            template.setMaxValue(10);
            template.setTimeLimitSeconds(30);
            template.setChoicesCount(4);
            em.persist(template);
            var question = new PlayerQuestion();
            question.setRacePlayer(player);
            question.setQuestionTemplate(template);
            question.setQuestionText("1+1");
            question.setCorrectAnswerValue(2);
            question.setTimeLimitSeconds(30);
            question.setExpiresAt(LocalDateTime.now().plusSeconds(30));
            em.persist(question);
            questionId = question.getId();
        });
    }

    @Test
    void ordinaryAndLegacyInitializationHaveSameDefaults() {
        tx.executeWithoutResult(status -> {
            var player = em.find(RacePlayer.class, playerId, LockModeType.PESSIMISTIC_WRITE);
            var first = states.createInitialState(player);
            assertDefaults(first);
            em.flush();
            em.clear();
            assertDefaults(states.obtainForLockedPlayer(
                    em.find(RacePlayer.class, playerId, LockModeType.PESSIMISTIC_WRITE)));
        });
        tx.executeWithoutResult(status -> gameplay.deleteById(gameplay.findByRacePlayerId(playerId).orElseThrow().getId()));
        tx.executeWithoutResult(status -> {
            var player = em.find(RacePlayer.class, playerId, LockModeType.PESSIMISTIC_WRITE);
            assertDefaults(states.obtainForLockedPlayer(player));
            assertSame(states.obtainForLockedPlayer(player), states.obtainForLockedPlayer(player));
        });
    }

    @Test
    void databaseDefaultsApplyWithoutJavaInitializers() {
        tx.executeWithoutResult(status -> {
            em.createNativeQuery("insert into race_player_gameplay_states (race_player_id,created_at) values (:id,CURRENT_TIMESTAMP)")
                    .setParameter("id", playerId).executeUpdate();
            em.clear();
            assertDefaults(gameplay.findByRacePlayerId(playerId).orElseThrow());
        });
    }

    @ParameterizedTest
    @ValueSource(strings = {"guard_shield_charges = -1", "guard_shield_charges = 2",
            "luck_events_received = -1", "luck_events_received = 3", "luck_rolls_taken = -1"})
    void databaseRangeViolationRollsBackWholeTransaction(String assignment) {
        assertThrows(RuntimeException.class, () -> tx.executeWithoutResult(status -> {
            states.createInitialState(em.find(RacePlayer.class, playerId));
            em.flush();
            em.createNativeQuery("update race_player_gameplay_states set " + assignment + " where race_player_id = :id")
                    .setParameter("id", playerId).executeUpdate();
        }));
        tx.executeWithoutResult(status -> assertTrue(gameplay.findByRacePlayerId(playerId).isEmpty()));
    }

    @Test
    void fairnessIsUniquePerRaceAndRollsBack() {
        assertThrows(RuntimeException.class, () -> tx.executeWithoutResult(status -> {
            var race = em.find(Race.class, raceId, LockModeType.PESSIMISTIC_WRITE);
            for (int i = 0; i < 2; i++) {
                var state = new RaceLuckFairnessState();
                state.setRace(race);
                fairness.saveAndFlush(state);
            }
        }));
        tx.executeWithoutResult(status -> assertTrue(fairness.findByRaceId(raceId).isEmpty()));
    }

    @Test
    void attemptIsUniquePerSourceQuestionIncludingNoEventAndRollbackIsAtomic() {
        assertThrows(RuntimeException.class, () -> tx.executeWithoutResult(status -> {
            decisions.saveAndFlush(decision(1L));
            decisions.saveAndFlush(decision(2L));
        }));
        tx.executeWithoutResult(status -> assertFalse(
                decisions.existsByRacePlayerIdAndSourceQuestionId(playerId, questionId)));
        tx.executeWithoutResult(status -> decisions.saveAndFlush(decision(1L)));
        tx.executeWithoutResult(status -> {
            var history = decisions.findByRacePlayerIdOrderByDecisionSequenceAsc(playerId);
            assertEquals(1, history.size());
            assertEquals(LuckOutcome.NO_EVENT, history.getFirst().getOutcome());
            assertNotNull(history.getFirst().getId());
        });
    }

    @Test
    void malformedAuditOutcomeIsRejectedByDatabase() {
        assertThrows(RuntimeException.class, () -> tx.executeWithoutResult(status -> {
            var decision = decision(1L);
            decision.setOutcome(LuckOutcome.APPLIED);
            decisions.saveAndFlush(decision);
        }));
    }

    @Test
    void twoPlayersSerializeSequenceAllocationUnderPlayerThenRaceLocks() throws Exception {
        Long peerId = tx.execute(status -> {
            var player = new RacePlayer();
            player.setRace(em.find(Race.class, raceId));
            player.setDisplayName("Peer");
            player.setLaneNumber(2);
            em.persist(player);
            return player.getId();
        });
        var ready = new java.util.concurrent.CountDownLatch(2);
        var start = new java.util.concurrent.CountDownLatch(1);
        try (var executor = java.util.concurrent.Executors.newFixedThreadPool(2)) {
            var first = executor.submit(() -> allocate(playerId, ready, start));
            var second = executor.submit(() -> allocate(peerId, ready, start));
            assertTrue(ready.await(10, java.util.concurrent.TimeUnit.SECONDS));
            start.countDown();
            var sequences = java.util.stream.Stream.of(
                    first.get(10, java.util.concurrent.TimeUnit.SECONDS),
                    second.get(10, java.util.concurrent.TimeUnit.SECONDS)).sorted().toList();
            assertEquals(java.util.List.of(1L, 2L), sequences);
        }
        tx.executeWithoutResult(status -> assertEquals(2L,
                fairness.findByRaceId(raceId).orElseThrow().getDecisionSequence()));
    }

    private Long allocate(Long id, java.util.concurrent.CountDownLatch ready,
                          java.util.concurrent.CountDownLatch start) throws Exception {
        ready.countDown();
        assertTrue(start.await(10, java.util.concurrent.TimeUnit.SECONDS));
        return tx.execute(status -> {
            var player = em.find(RacePlayer.class, id, LockModeType.PESSIMISTIC_WRITE);
            em.find(Race.class, raceId, LockModeType.PESSIMISTIC_WRITE);
            var state = fairnessOwner.obtainForLockedPlayer(player);
            state.setDecisionSequence(state.getDecisionSequence() + 1);
            em.flush();
            return state.getDecisionSequence();
        });
    }

    private RacePlayerLuckDecision decision(long sequence) {
        var result = new RacePlayerLuckDecision();
        result.setRacePlayer(em.find(RacePlayer.class, playerId));
        result.setSourceQuestion(em.find(PlayerQuestion.class, questionId));
        result.setDecisionSequence(sequence);
        result.setDecidedAtEpochMs(100L);
        result.setOutcome(LuckOutcome.NO_EVENT);
        return result;
    }

    private void assertDefaults(RacePlayerGameplayState state) {
        assertEquals(0, state.getChallengeEnergy());
        assertEquals(0, state.getGuardShieldCharges());
        assertFalse(state.getGuardShieldGranted());
        assertNull(state.getGuardShieldAwardQuestionId());
        assertEquals(0, state.getLuckRollsTaken());
        assertEquals(0, state.getLuckEventsReceived());
        assertNull(state.getNextLuckRollNotBeforeEpochMs());
        assertNull(state.getLastLuckRollSequence());
        assertNull(state.getLastLuckReceivedSequence());
        assertNull(state.getLastAcceptedManualNormalAnswerAtEpochMs());
        assertFalse(state.getLastLuckWasNegative());
    }
}
