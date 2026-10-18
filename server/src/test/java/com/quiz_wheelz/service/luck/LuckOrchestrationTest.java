package com.quiz_wheelz.service.luck;

import com.quiz_wheelz.entitys.*;
import com.quiz_wheelz.enums.*;
import com.quiz_wheelz.repository.RacePlayerSpeedEffectRepository;
import com.quiz_wheelz.service.raceengine.RacePlayerSpeedEffectService;
import jakarta.persistence.LockModeType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import java.time.LocalDateTime;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@Import({FairLuckService.class, GuardShieldService.class, LuckTransactionGuard.class,
        LuckEffectResolver.class, LuckOwnStateReader.class, LuckPeerReader.class, RacePlayerSpeedEffectService.class})
class LuckOrchestrationTest extends LuckPersistenceTest {
    @Autowired FairLuckService luck;
    @Autowired LuckPeerReader peers;
    @Autowired RacePlayerSpeedEffectRepository effects;
    @MockitoBean LuckRandomSource random;

    @BeforeEach
    void activate() {
        tx.executeWithoutResult(status -> {
            em.find(Race.class, raceId).setStatus(RaceStatus.IN_PROGRESS);
            em.find(RacePlayer.class, playerId).setStatus(RacePlayerStatus.RACING);
            em.find(RacePlayer.class, playerId).setSpeed(1.0);
            em.find(PlayerQuestion.class, questionId).setStatus(PlayerQuestionStatus.ANSWERED);
        });
    }

    private RacePlayer locked() {
        var player = em.find(RacePlayer.class, playerId, LockModeType.PESSIMISTIC_WRITE);
        em.find(Race.class, raceId, LockModeType.PESSIMISTIC_WRITE);
        return player;
    }

    private RacePlayerLuckDecision attempt(long instant) {
        var player = locked();
        return luck.afterAcceptedManualNormalAnswer(player, em.find(PlayerQuestion.class, questionId),
                false, true, instant).orElse(null);
    }

    @Test
    void noEventPersistsCooldownAndDuplicateConsumesNoRandom() {
        when(random.nextDouble()).thenReturn(0.6);
        tx.executeWithoutResult(status -> assertEquals(LuckOutcome.NO_EVENT, attempt(100).getOutcome()));
        tx.executeWithoutResult(status -> assertNull(attempt(100)));
        verify(random, times(1)).nextDouble();
        tx.executeWithoutResult(status -> {
            var state = gameplay.findByRacePlayerId(playerId).orElseThrow();
            assertEquals(1, state.getLuckRollsTaken());
            assertEquals(0, state.getLuckEventsReceived());
            assertEquals(45100L, state.getNextLuckRollNotBeforeEpochMs());
            assertEquals(1L, fairness.findByRaceId(raceId).orElseThrow().getDecisionSequence());
        });
    }

    @Test
    void rollbackRemovesEffectAuditCountersAndLazyState() {
        when(random.nextDouble()).thenReturn(0.0);
        assertThrows(IllegalStateException.class, () -> tx.executeWithoutResult(status -> {
            assertNotNull(attempt(100).getSpeedEffect());
            em.flush();
            throw new IllegalStateException();
        }));
        tx.executeWithoutResult(status -> {
            assertTrue(gameplay.findByRacePlayerId(playerId).isEmpty());
            assertTrue(fairness.findByRaceId(raceId).isEmpty());
            assertTrue(decisions.findByRacePlayerIdOrderByDecisionSequenceAsc(playerId).isEmpty());
            assertTrue(effects.findOverlapping(playerId, 0, 10000).isEmpty());
        });
    }

    @Test
    void thirdCorrectAwardsShieldAndReplayCannotDrawOrReawardAfterConsumption() {
        tx.executeWithoutResult(status -> {
            var player = locked();
            player.setCorrectAnswers(3);
            assertTrue(luck.afterAcceptedManualNormalAnswer(player, em.find(PlayerQuestion.class, questionId),
                    true, true, 100).isEmpty());
        });
        tx.executeWithoutResult(status -> {
            var player = locked();
            var state = gameplay.findByRacePlayerId(playerId).orElseThrow();
            assertEquals(1, state.getGuardShieldCharges());
            state.setGuardShieldCharges(0);
            assertTrue(luck.afterAcceptedManualNormalAnswer(player, em.find(PlayerQuestion.class, questionId),
                    true, true, 200).isEmpty());
            assertEquals(0, state.getGuardShieldCharges());
            assertEquals(questionId, state.getGuardShieldAwardQuestionId());
        });
        verifyNoInteractions(random);
    }

    @Test
    void foreignQuestionAndMissingLocksAreRejectedBeforeAnyMutation() {
        Long peerId = peer();
        tx.executeWithoutResult(status -> em.find(PlayerQuestion.class, questionId)
                .setRacePlayer(em.find(RacePlayer.class, peerId)));
        assertThrows(IllegalArgumentException.class, () -> tx.executeWithoutResult(status -> attempt(100)));
        assertThrows(IllegalStateException.class, () -> tx.executeWithoutResult(status -> {
            var player = em.find(RacePlayer.class, playerId);
            luck.afterAcceptedManualNormalAnswer(player, em.find(PlayerQuestion.class, questionId), false, true, 100);
        }));
        verifyNoInteractions(random);
        tx.executeWithoutResult(status -> assertTrue(gameplay.findByRacePlayerId(playerId).isEmpty()));
    }

    @Test
    void blockedMudCountsAsNegativeAndNextTangibleEventCannotBeMud() {
        tx.executeWithoutResult(status -> {
            var state = states.createInitialState(em.find(RacePlayer.class, playerId));
            state.setGuardShieldGranted(true);
            state.setGuardShieldCharges(1);
        });
        when(random.nextDouble()).thenReturn(0.0, 0.99, 0.0, 0.99);
        tx.executeWithoutResult(status -> {
            assertEquals(LuckOutcome.BLOCKED_BY_SHIELD, attempt(100).getOutcome());
            var state = gameplay.findByRacePlayerId(playerId).orElseThrow();
            assertEquals(0, state.getGuardShieldCharges());
            assertEquals(1, state.getLuckEventsReceived());
            assertTrue(state.getLastLuckWasNegative());
            assertTrue(effects.findOverlapping(playerId, 0, 10000).isEmpty());
        });
        nextQuestion();
        tx.executeWithoutResult(status -> assertEquals(LuckEventType.ENERGY_ORB, attempt(45100).getAppliedType()));
        nextQuestion();
        tx.executeWithoutResult(status -> assertNull(attempt(90100)));
        verify(random, times(4)).nextDouble();
        tx.executeWithoutResult(status -> {
            var state = gameplay.findByRacePlayerId(playerId).orElseThrow();
            assertEquals(2, state.getLuckEventsReceived());
            assertEquals(15, state.getChallengeEnergy());
            assertFalse(state.getLastLuckWasNegative());
        });
    }

    @Test
    void orbAtCapacityConsumesCooldownWithoutCapOrChallengeCreation() {
        when(random.nextDouble()).thenReturn(0.0, 0.5);
        tx.executeWithoutResult(status -> states.createInitialState(em.find(RacePlayer.class, playerId)).setChallengeEnergy(100));
        tx.executeWithoutResult(status -> assertEquals(LuckOutcome.NO_EFFECT, attempt(100).getOutcome()));
        tx.executeWithoutResult(status -> {
            var state = gameplay.findByRacePlayerId(playerId).orElseThrow();
            assertEquals(0, state.getLuckEventsReceived());
            assertEquals(45100L, state.getNextLuckRollNotBeforeEpochMs());
            assertEquals(0L, em.createQuery("select count(o) from RacePlayerChallengeOffer o where o.racePlayer.id = :id", Long.class)
                    .setParameter("id", playerId).getSingleResult());
        });
    }

    @Test
    void boostIsPersistedWithStableAuditWindowAndNoLearningMutation() {
        when(random.nextDouble()).thenReturn(0.0);
        tx.executeWithoutResult(status -> {
            var decision = attempt(100);
            assertEquals(EffectType.SPEED_BOOST, decision.getSpeedEffect().getType());
            assertEquals(100L, decision.getSpeedEffect().getStartsAtEpochMs());
            assertEquals(4100L, decision.getSpeedEffect().getEndsAtEpochMs());
            assertEquals(0, decision.getRacePlayer().getScore());
            assertEquals(0, decision.getRacePlayer().getCorrectAnswers());
            assertEquals(1.0, decision.getRacePlayer().getSpeed());
        });
    }

    @ParameterizedTest
    @ValueSource(strings = {"DISCONNECTED", "FINISH_GATE", "CAP", "COOLDOWN", "CHOICE", "TURBO", "SAFE", "SLOW", "BOOST", "AFK", "NO_ACTIVITY"})
    void freshPeerReaderExcludesEveryIneligiblePeer(String exclusion) {
        Long id = peer();
        tx.executeWithoutResult(status -> {
            var player = em.find(RacePlayer.class, id);
            var state = gameplay.findByRacePlayerId(id).orElseThrow();
            switch (exclusion) {
                case "AFK" -> state.setLastAcceptedManualNormalAnswerAtEpochMs(-60000L);
                case "NO_ACTIVITY" -> state.setLastAcceptedManualNormalAnswerAtEpochMs(null);
                case "DISCONNECTED" -> player.setStatus(RacePlayerStatus.DISCONNECTED);
                case "FINISH_GATE" -> player.setPosition(800.0);
                case "CAP" -> state.setLuckEventsReceived(2);
                case "COOLDOWN" -> state.setNextLuckRollNotBeforeEpochMs(101L);
                case "CHOICE", "TURBO", "SAFE" -> {
                    var offer = new RacePlayerChallengeOffer();
                    offer.setRacePlayer(player);
                    offer.setOfferedAtEpochMs(0L);
                    offer.setExpiresAtEpochMs(12000L);
                    if (!exclusion.equals("CHOICE")) {
                        offer.setStatus(ChallengeOfferStatus.SELECTED);
                        offer.setChoice(exclusion.equals("TURBO") ? ChallengeChoice.TURBO_TRIAL : ChallengeChoice.SAFE_RUN);
                        offer.setResolvedAtEpochMs(0L);
                    }
                    em.persist(offer);
                }
                case "SLOW", "BOOST" -> {
                    var effect = new RacePlayerSpeedEffect();
                    effect.setRacePlayer(player);
                    effect.setType(exclusion.equals("SLOW") ? EffectType.SPEED_SLOW : EffectType.SPEED_BOOST);
                    effect.setSource(EffectSource.LUCK_EVENT);
                    effect.setMagnitudeTenths(1);
                    effect.setStartsAtEpochMs(0L);
                    effect.setEndsAtEpochMs(200L);
                    em.persist(effect);
                }
                default -> throw new IllegalArgumentException();
            }
        });
        assertTrue(peers.readCommittedPeers(raceId, playerId, 100).isEmpty());
    }

    @Test
    void fairnessDeferralConsumesNeitherRandomNorCooldown() {
        peer();
        tx.executeWithoutResult(status -> {
            var player = locked();
            var state = states.createInitialState(player);
            state.setLuckEventsReceived(1);
            var raceState = new RaceLuckFairnessState();
            raceState.setRace(player.getRace());
            raceState.setDecisionSequence(1L);
            raceState.setLastEventRecipient(player);
            raceState.setLastEventSequence(1L);
            fairness.save(raceState);
        });
        tx.executeWithoutResult(status -> {
            assertNull(attempt(100));
            var state = gameplay.findByRacePlayerId(playerId).orElseThrow();
            assertEquals(0, state.getLuckRollsTaken());
            assertNull(state.getNextLuckRollNotBeforeEpochMs());
            assertEquals(1L, fairness.findByRaceId(raceId).orElseThrow().getDecisionSequence());
        });
        verifyNoInteractions(random);
    }

    @Test
    void rejectedAcceptanceAndBackgroundQuestionCannotDraw() {
        tx.executeWithoutResult(status -> {
            var player = locked();
            assertTrue(luck.afterAcceptedManualNormalAnswer(player, em.find(PlayerQuestion.class, questionId),
                    false, false, 100).isEmpty());
            em.find(PlayerQuestion.class, questionId).setStatus(PlayerQuestionStatus.EXPIRED);
            assertThrows(IllegalArgumentException.class, () -> luck.afterAcceptedManualNormalAnswer(player,
                    em.find(PlayerQuestion.class, questionId), false, true, 100));
            status.setRollbackOnly();
        });
        verifyNoInteractions(random);
    }

    @Test
    void tailwindAuditRecordsOnlyAvailableSpeedBelowCap() {
        when(random.nextDouble()).thenReturn(0.0);
        tx.executeWithoutResult(status -> {
            var player = locked();
            player.setSpeed(1.9);
            assertEquals(0.1, attempt(100).getEffectiveMagnitudeOrEnergyDelta());
        });
    }

    @Test
    void futureOverlapRejectsAndRollsBackDecisionAndCounters() {
        when(random.nextDouble()).thenReturn(0.0);
        tx.executeWithoutResult(status -> {
            var effect = new RacePlayerSpeedEffect();
            effect.setRacePlayer(em.find(RacePlayer.class, playerId));
            effect.setType(EffectType.SPEED_SLOW);
            effect.setSource(EffectSource.TURBO_FAILURE);
            effect.setMagnitudeTenths(1);
            effect.setStartsAtEpochMs(200L);
            effect.setEndsAtEpochMs(500L);
            effects.saveAndFlush(effect);
        });
        var exception = assertThrows(com.quiz_wheelz.exception.ApiException.class,
                () -> tx.executeWithoutResult(status -> attempt(100)));
        assertEquals(com.quiz_wheelz.exception.ErrorCode.SPEED_EFFECT_OVERLAP, exception.getErrorCode());
        tx.executeWithoutResult(status -> {
            assertTrue(gameplay.findByRacePlayerId(playerId).isEmpty());
            assertTrue(fairness.findByRaceId(raceId).isEmpty());
            assertTrue(decisions.findByRacePlayerIdOrderByDecisionSequenceAsc(playerId).isEmpty());
            assertEquals(1, effects.findOverlapping(playerId, 0, 10000).size());
        });
    }

    private Long peer() {
        return tx.execute(status -> {
            var player = new RacePlayer();
            player.setRace(em.find(Race.class, raceId));
            player.setDisplayName("Peer");
            player.setLaneNumber(2);
            player.setStatus(RacePlayerStatus.RACING);
            em.persist(player);
            states.createInitialState(player).setLastAcceptedManualNormalAnswerAtEpochMs(100L);
            return player.getId();
        });
    }

    private void nextQuestion() {
        questionId = tx.execute(status -> {
            var previous = em.find(PlayerQuestion.class, questionId);
            var question = new PlayerQuestion();
            question.setRacePlayer(previous.getRacePlayer());
            question.setQuestionTemplate(previous.getQuestionTemplate());
            question.setQuestionText("1+1");
            question.setCorrectAnswerValue(2);
            question.setTimeLimitSeconds(30);
            question.setExpiresAt(LocalDateTime.now().plusSeconds(30));
            question.setStatus(PlayerQuestionStatus.ANSWERED);
            em.persist(question);
            return question.getId();
        });
    }
}
