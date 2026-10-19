package com.quiz_wheelz.service.raceplayer;

import com.quiz_wheelz.dto.raceplayer.StudentRaceRuntimeSnapshotResponse;
import com.quiz_wheelz.enums.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class B2LuckSnapshotIntegrationTest extends B2LuckIntegrationFixture {
    @ParameterizedTest
    @ValueSource(strings = {"NONE", "SHIELD", "BLOCKED", "TAILWIND", "ORB", "MUD", "NO_EFFECT"})
    void acceptedAnswerRefreshAndReconnectShareStablePrivateContract(String scenario) throws Exception {
        prepare(scenario);
        var response = submit(scenario.equals("SHIELD"));
        var accepted = response.getRaceImpact().getSnapshot();
        var live = snapshot();
        assertEquals(accepted.getGameplay(), live.getGameplay());
        assertEquals(accepted.getMovementUnitsPerSecond(), live.getMovementUnitsPerSecond());
        assertEquals(accepted.getEventVersion(), live.getEventVersion());
        var ids = accepted.getGameplay().luck().recentEvents();
        assertTrue(ids.size() <= 2);
        if (scenario.equals("SHIELD")) {
            assertEquals(1, accepted.getGameplay().powerUps().guardShieldCharges());
            assertEquals(questionId, accepted.getGameplay().powerUps().guardShieldAwardQuestionId());
            assertTrue(ids.isEmpty());
            verifyNoInteractions(random);
        } else if (scenario.equals("NONE") || scenario.equals("NO_EFFECT")) {
            assertTrue(ids.isEmpty());
            assertEquals(1, history().size());
            assertEquals(scenario.equals("NONE") ? LuckOutcome.NO_EVENT : LuckOutcome.NO_EFFECT, history().getFirst().getOutcome());
        } else {
            assertEquals(1, ids.size());
            var audit = history().getFirst();
            var event = ids.getFirst();
            assertEquals(audit.getId(), event.eventId());
            assertEquals(audit.getSelectedType(), event.selectedType());
            assertEquals(audit.getAppliedType(), event.appliedType());
            assertEquals(audit.getOutcome(), event.outcome());
            assertEquals(audit.getDecidedAtEpochMs(), event.occurredAtEpochMs());
            if (scenario.equals("BLOCKED")) {
                assertEquals(LuckOutcome.BLOCKED_BY_SHIELD, event.outcome());
                assertEquals(LuckEventType.MUD_SPLASH, event.appliedType());
                assertEquals(0, accepted.getGameplay().powerUps().guardShieldCharges());
                assertNotNull(accepted.getGameplay().powerUps().guardShieldAwardQuestionId());
                assertNotEquals(questionId, accepted.getGameplay().powerUps().guardShieldAwardQuestionId());
                assertTrue(accepted.getGameplay().activeEffects().isEmpty());
            }
            if (scenario.equals("ORB")) {
                assertEquals(15, accepted.getGameplay().challenge().energy());
                assertNull(accepted.getGameplay().challenge().offer());
            }
            if (scenario.equals("TAILWIND") || scenario.equals("MUD")) {
                var active = accepted.getGameplay().activeEffects().getFirst();
                assertEquals(audit.getSpeedEffect().getId(), active.effectId());
                assertEquals(EffectSource.LUCK_EVENT, active.source());
                assertEquals(scenario.equals("TAILWIND") ? EffectType.SPEED_BOOST : EffectType.SPEED_SLOW, active.type());
                assertEquals(scenario.equals("TAILWIND") ? 4000 : 3000, active.endsAtEpochMs() - active.startsAtEpochMs());
                assertEquals(scenario.equals("TAILWIND") ? 1.0 : .7, accepted.getGameplay().effectiveSpeed());
            }
        }
        assertEquals(accepted.getGameplay().effectiveSpeed() * 4, accepted.getMovementUnitsPerSecond());
        var beforeDraws = mockingDetails(random).getInvocations().size();
        when(redisPresenceService.isOnline(raceId, secondId)).thenReturn(false);
        reconnect.reconnect(secondRequest);
        when(redisPresenceService.isOnline(raceId, secondId)).thenReturn(true);
        var recovered = snapshot();
        assertEquals(accepted.getGameplay(), recovered.getGameplay());
        assertEquals(beforeDraws, mockingDetails(random).getInvocations().size());
        writeExample(scenario, accepted);
    }

    @ParameterizedTest
    @ValueSource(strings = {"TAILWIND", "MUD"})
    void silenceAcrossExpiryRestoresRateWithoutDeletingAuditOrDrawing(String scenario) throws Exception {
        prepare(scenario);
        var accepted = submit(false).getRaceImpact().getSnapshot();
        var effect = accepted.getGameplay().activeEffects().getFirst();
        long duration = effect.endsAtEpochMs() - effect.startsAtEpochMs();
        clock.set(T + duration - 1);
        var justBefore = snapshot();
        assertEquals(1, justBefore.getGameplay().activeEffects().size());
        assertEquals(accepted.getMovementUnitsPerSecond(), justBefore.getMovementUnitsPerSecond());
        clock.set(T + duration);
        var expired = snapshot();
        assertTrue(expired.getGameplay().activeEffects().isEmpty());
        assertEquals(.8, expired.getGameplay().effectiveSpeed());
        assertEquals(3.2, expired.getMovementUnitsPerSecond());
        assertEquals(100 + duration * (scenario.equals("TAILWIND") ? .004 : .0028), expired.getPosition(), .00001);
        assertEquals(T + duration, expired.getPositionAtEpochMs());
        assertEquals(accepted.getGameplay().luck(), expired.getGameplay().luck());
        assertEquals(1, history().size());
        assertTrue(effectRepository.existsById(effect.effectId()));
        verify(random, times(2)).nextDouble();
        writeExample(scenario + "_EXPIRED", expired);
    }

    @Test
    void acceptedTailwindAtBaseOnePointNineClipsActualRateToTwo() throws Exception {
        transactions.executeWithoutResult(status -> playerRepository.findById(secondId).orElseThrow().setSpeed(1.7));
        prepare("TAILWIND");
        var result = submit(true).getRaceImpact().getSnapshot();
        assertEquals(1.9, result.getSpeed());
        assertEquals(2.0, result.getGameplay().effectiveSpeed());
        assertEquals(8.0, result.getMovementUnitsPerSecond());
        assertEquals(.1, history().getFirst().getEffectiveMagnitudeOrEnergyDelta());
        clock.set(T + 4000);
        var expired = snapshot();
        assertEquals(142.0, expired.getPosition());
        assertEquals(7.6, expired.getMovementUnitsPerSecond());
        writeExample("TAILWIND_CLIPPED", result);
    }

    @Test
    void twoTangibleEventsAreOrderedByStableIdWhileNoEventRemainsAuditOnly() throws Exception {
        when(random.nextDouble()).thenReturn(.6);
        assertTrue(submit(false).getRaceImpact().getSnapshot().getGameplay().luck().recentEvents().isEmpty());
        nextQuestion(T + 45000);
        when(random.nextDouble()).thenReturn(0.0, .5);
        submit(false);
        nextQuestion(T + 90000);
        when(random.nextDouble()).thenReturn(0.0, .99);
        var result = submit(false).getRaceImpact().getSnapshot();
        var history = history();
        assertEquals(3, history.size());
        var events = result.getGameplay().luck().recentEvents();
        assertEquals(2, events.size());
        assertEquals(history.get(1).getId(), events.get(0).eventId());
        assertEquals(history.get(2).getId(), events.get(1).eventId());
        assertTrue(events.get(0).eventId() < events.get(1).eventId());
        assertEquals(LuckEventType.ENERGY_ORB, events.get(0).appliedType());
        assertEquals(LuckEventType.MUD_SPLASH, events.get(1).appliedType());
        assertEquals(events, snapshot().getGameplay().luck().recentEvents());
        writeExample("TWO_EVENTS", result);
    }

    @ParameterizedTest
    @ValueSource(strings = {"SHIELD", "BLOCKED", "TAILWIND"})
    void finishedSnapshotKeepsAwardAndHistoryButStopsAllMovement(String scenario) throws Exception {
        prepare(scenario);
        var accepted = submit(scenario.equals("SHIELD")).getRaceImpact().getSnapshot();
        transactions.executeWithoutResult(status -> {
            var player = playerRepository.findById(secondId).orElseThrow();
            player.setPosition(1000.0);
            player.setStatus(RacePlayerStatus.FINISHED);
            player.setSpeed(0.0);
            player.setFinishedAtEpochMs(T);
            player.setFinishedAt(local(T));
        });
        var finished = snapshot();
        assertEquals(0.0, finished.getMovementUnitsPerSecond());
        assertEquals(0.0, finished.getGameplay().effectiveSpeed());
        assertTrue(finished.getGameplay().activeEffects().isEmpty());
        assertEquals(accepted.getGameplay().luck(), finished.getGameplay().luck());
        assertEquals(accepted.getGameplay().powerUps(), finished.getGameplay().powerUps());
        var arbitration = arbitrationService.arbitrate(secondRequest);
        assertEquals(finished.getGameplay(), arbitration.getSnapshot().getGameplay());
        writeExample("FINISHED_" + scenario, finished);
    }

}
