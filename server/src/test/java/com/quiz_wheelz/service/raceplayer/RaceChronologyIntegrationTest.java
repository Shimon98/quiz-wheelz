package com.quiz_wheelz.service.raceplayer;

import com.quiz_wheelz.entitys.RacePlayer;
import com.quiz_wheelz.enums.RaceLiveEventType;
import com.quiz_wheelz.enums.RacePlayerStatus;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import com.quiz_wheelz.service.raceengine.RaceDecisionTimeService;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

class RaceChronologyIntegrationTest extends RaceChronologyIntegrationFixture {

    @Autowired
    RaceDecisionTimeService decisionTimeService;

    @Test
    void staleManagedRaceCannotLowerTheFloorOnAReadOrOnFlush() {
        transactions.executeWithoutResult(status -> {
            var staleRace = raceRepository.findById(raceId).orElseThrow();
            assertNull(staleRace.getAuthoritativeDecisionTimeFloorEpochMs());
            raceRepository.advanceDecisionTimeFloor(raceId, T + 500);
            assertNull(staleRace.getAuthoritativeDecisionTimeFloorEpochMs());
            assertEquals(T + 500, decisionTimeService.advance(staleRace, T));
            staleRace.setAuthoritativeDecisionTimeFloorEpochMs(T - 500);
            staleRace.setTitle("Stale managed race");
            entityManager.flush();
        });

        assertEquals(T + 500, race().getAuthoritativeDecisionTimeFloorEpochMs());
    }

    @Test
    void confirmedWinnerSurvivesClockRegressionAndAnswerFinish() {
        var proof = arbitrationService.arbitrate(firstRequest).getFinishOrder();
        assertEquals(List.of(firstId), proof.getConfirmedFinishers().stream()
                .map(finisher -> finisher.getRacePlayerId()).toList());
        assertEquals(T, race().getAuthoritativeDecisionTimeFloorEpochMs());

        clock.set(T - 1_100);
        var response = answerSecond();

        assertEquals(T, second().getFinishedAtEpochMs());
        assertEquals(2, response.getRaceImpact().getSnapshot().getRank());
        assertEquals(T, response.getAnsweredAtEpochMs());
        assertEquals(T, response.getRaceImpact().getSnapshot().getSnapshotAtEpochMs());
        assertEquals(List.of(RaceLiveEventType.QUESTION_ANSWERED,
                RaceLiveEventType.PLAYER_FINISHED, RaceLiveEventType.RACE_FINISHED), eventTypes());
        assertEquals(race().getLiveEventVersion(), response.getRaceImpact().getSnapshot().getEventVersion());
        arbitrationService.arbitrate(firstRequest);
        assertEquals(3, eventTypes().size());
    }

    @Test
    void confirmedTieCannotBecomeALaterActionsEarlierUniqueWin() {
        Long tiedId = transactions.execute(status -> {
            var race = raceRepository.findById(raceId).orElseThrow();
            RacePlayer tied = player(race, "Tied", 3, 1000.0);
            tied.setStatus(RacePlayerStatus.FINISHED);
            tied.setSpeed(0.0);
            tied.setFinishedAtEpochMs(T - 1_000);
            tied.setFinishedAt(local(T - 1_000));
            entityManager.persist(tied);
            entityManager.flush();
            return tied.getId();
        });
        var confirmed = arbitrationService.arbitrate(firstRequest).getFinishOrder().getConfirmedFinishers();
        assertEquals(List.of(firstId, tiedId), confirmed.stream().map(f -> f.getRacePlayerId()).toList());
        assertEquals(List.of(1, 1), confirmed.stream().map(f -> f.getRank()).toList());

        clock.set(T - 1_100);
        var answer = answerSecond();

        assertEquals(T, second().getFinishedAtEpochMs());
        assertEquals(3, answer.getRaceImpact().getSnapshot().getRank());
        assertEquals(List.of(1, 1), answer.getRaceImpact().getSnapshot().getOpponents()
                .stream().map(opponent -> opponent.getRank()).toList());
    }

    @Test
    void ordinaryNonFinishingAnswerRetainsItsWallTimeAndGameplay() {
        secondPosition(100.0);
        assertNull(race().getAuthoritativeDecisionTimeFloorEpochMs());

        var answer = answerSecond();

        assertEquals(T, answer.getAnsweredAtEpochMs());
        assertEquals(110.0, second().getPosition());
        assertEquals(1.2, second().getSpeed());
        assertEquals(1, second().getCorrectAnswers());
        assertEquals(0, second().getWrongAnswers());
        assertNull(second().getFinishedAtEpochMs());
        assertEquals(T, race().getAuthoritativeDecisionTimeFloorEpochMs());
    }

    @Test
    void ordinaryBonusFinishUsesTheUnchangedAnswerDecisionTime() {
        clock.set(T + 100);

        var answer = answerSecond();

        assertEquals(T + 100, second().getFinishedAtEpochMs());
        assertEquals(local(T + 100), second().getFinishedAt());
        assertEquals(T + 100, answer.getAnsweredAtEpochMs());
        assertEquals(1000.0, second().getPosition());
        assertEquals(0.0, second().getSpeed());
    }

    @Test
    void advancingWallTimeRaisesThePersistedFloorWithoutArtificialMillisecondIncrements() {
        arbitrationService.arbitrate(firstRequest);
        clock.set(T + 200);
        var first = arbitrationService.arbitrate(firstRequest);
        var repeated = arbitrationService.arbitrate(firstRequest);

        assertEquals(T + 200, first.getFinishOrder().getDecidedAtEpochMs());
        assertEquals(T + 200, repeated.getFinishOrder().getDecidedAtEpochMs());
        assertEquals(T + 200, race().getAuthoritativeDecisionTimeFloorEpochMs());
    }
}
