package com.quiz_wheelz.service.raceplayer;

import com.quiz_wheelz.dto.raceplayer.StudentRaceConfirmedFinisherResponse;
import com.quiz_wheelz.dto.raceplayer.StudentRaceFinishArbitrationResponse;
import com.quiz_wheelz.dto.raceplayer.StudentRaceOpponentResponse;
import com.quiz_wheelz.entitys.PlayerQuestion;
import com.quiz_wheelz.entitys.RacePlayer;
import com.quiz_wheelz.enums.PlayerQuestionStatus;
import com.quiz_wheelz.enums.RacePlayerStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;

import static com.quiz_wheelz.service.raceplayer.StudentRaceFinishArbitrationTestFixture.ANCHOR;
import static com.quiz_wheelz.service.raceplayer.StudentRaceFinishArbitrationTestFixture.EVENT_VERSION;
import static com.quiz_wheelz.service.raceplayer.StudentRaceFinishArbitrationTestFixture.NOW;
import static com.quiz_wheelz.service.raceplayer.StudentRaceFinishArbitrationTestFixture.T;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

class StudentRaceFinishArbitrationProofTest {

    private StudentRaceFinishArbitrationTestFixture fixture;

    @BeforeEach
    void setUp() {
        fixture = new StudentRaceFinishArbitrationTestFixture();
    }

    @Test
    void laterRequestByBDoesNotBeatTheEarlierMathematicalCrossingOfA() {
        RacePlayer a = fixture.racing(1L, 998.0, 2.0, ANCHOR);
        RacePlayer b = fixture.racing(2L, 996.0, 2.0, ANCHOR);
        fixture.requester(b);
        fixture.online(a);
        fixture.online(b);

        StudentRaceFinishArbitrationResponse response = fixture.arbitrate();

        assertEquals(T - 750, a.getFinishedAtEpochMs());
        assertEquals(T - 500, b.getFinishedAtEpochMs());
        assertEquals(2, response.getSnapshot().getRank());
        assertTrue(response.getSnapshot().isPlayerFinished());
        assertEquals(T - 500, response.getSnapshot().getPlayerFinishedAtEpochMs());
        assertEquals(EVENT_VERSION, response.getSnapshot().getEventVersion());
        StudentRaceOpponentResponse opponent = response.getSnapshot().getOpponents().get(0);
        assertEquals(1L, opponent.getRacePlayerId());
        assertEquals(1, opponent.getRank());
        assertEquals(RacePlayerStatus.FINISHED, opponent.getStatus());
        assertEquals(T - 750, opponent.getFinishedAtEpochMs());
        assertEquals(List.of(1L, 2L), confirmedIds(response));
        assertEquals(List.of(1, 2), confirmedRanks(response));
        assertEquals(T - 1, response.getFinishOrder().getConfirmedThroughEpochMs());
        assertEquals(T, response.getFinishOrder().getDecidedAtEpochMs());
    }

    @Test
    void answerBonusFinishKeepsItsDecisionInstantAgainstLaterCrossings() {
        RacePlayer answered = fixture.finished(1L, T - 900);
        RacePlayer crossing = fixture.racing(2L, 996.0, 2.0, ANCHOR);
        fixture.requester(crossing);
        fixture.online(crossing);

        StudentRaceFinishArbitrationResponse response = fixture.arbitrate();

        assertEquals(List.of(1L, 2L), confirmedIds(response));
        assertEquals(T - 900, answered.getFinishedAtEpochMs());
        assertEquals(T - 500, crossing.getFinishedAtEpochMs());
    }

    @Test
    void crossingBeforeTheAnswerDecisionIsNotLostRetroactively() {
        RacePlayer answeredLater = fixture.finished(1L, T - 920);
        RacePlayer crossedEarlier = fixture.racing(2L, 999.6, 2.0, ANCHOR);
        fixture.requester(answeredLater);
        fixture.online(crossedEarlier);

        StudentRaceFinishArbitrationResponse response = fixture.arbitrate();

        assertEquals(T - 950, crossedEarlier.getFinishedAtEpochMs());
        assertEquals(List.of(2L, 1L), confirmedIds(response));
        assertEquals(2, response.getSnapshot().getRank());
    }

    @Test
    void timeoutInsideTheArbitrationIntervalKeepsChronology() {
        RacePlayer a = fixture.racing(1L, 990.0, 2.0, ANCHOR);
        RacePlayer b = fixture.finished(2L, T - 500);
        PlayerQuestion question = fixture.activeQuestion(a, ANCHOR + 500);
        fixture.requester(a);
        fixture.online(a);

        StudentRaceFinishArbitrationResponse response = fixture.arbitrate();

        assertEquals(997.2, a.getPosition(), 1e-9);
        assertEquals(1.6, a.getSpeed(), 1e-9);
        assertEquals(1, a.getWrongAnswers());
        assertEquals(PlayerQuestionStatus.EXPIRED, question.getStatus());
        assertEquals(RacePlayerStatus.RACING, a.getStatus());
        assertEquals(List.of(2L), confirmedIds(response));
        assertEquals(T - 1, response.getFinishOrder().getConfirmedThroughEpochMs());
        assertEquals(b.getFinishedAtEpochMs(), response.getFinishOrder().getConfirmedFinishers().get(0).getFinishedAtEpochMs());
    }

    @Test
    void staleOpponentCutoffBlocksProofUntilItsTimelineAdvances() {
        RacePlayer requester = fixture.finished(1L, T - 300);
        RacePlayer stale = fixture.racing(2L, 996.0, 2.0, T - 800);
        fixture.requester(requester);
        fixture.absent(stale, T - 800);

        StudentRaceFinishArbitrationResponse blocked = fixture.arbitrate();

        assertEquals(996.0, stale.getPosition(), 1e-9);
        assertEquals(T - 800, stale.getMovementUpdatedAtEpochMs());
        assertEquals(T - 301, blocked.getFinishOrder().getConfirmedThroughEpochMs());
        assertTrue(blocked.getFinishOrder().getConfirmedFinishers().isEmpty());
        verify(fixture.presenceService, never()).recordGameplayActivity(any(), any());
        verify(fixture.presenceService, never()).renewPresenceLease(any(), any());

        fixture.online(stale);
        StudentRaceFinishArbitrationResponse grown = fixture.arbitrate();

        assertEquals(T - 300, stale.getFinishedAtEpochMs());
        assertEquals(List.of(1L, 2L), confirmedIds(grown));
        assertEquals(List.of(1, 1), confirmedRanks(grown));
        assertEquals(1, grown.getSnapshot().getRank());
        assertEquals(1, grown.getSnapshot().getOpponents().get(0).getRank());
    }

    @Test
    void ambiguousRosterMemberBlocksTheProofInsteadOfInventingCertainty() {
        RacePlayer requester = fixture.finished(1L, T - 500);
        fixture.waiting(2L);
        fixture.requester(requester);

        StudentRaceFinishArbitrationResponse response = fixture.arbitrate();

        assertNull(response.getFinishOrder().getConfirmedThroughEpochMs());
        assertTrue(response.getFinishOrder().getConfirmedFinishers().isEmpty());
        assertTrue(response.getSnapshot().isPlayerFinished());
        assertEquals(1, response.getSnapshot().getRank());
    }

    @Test
    void hiddenOpponentGetsNoCatchUpMovementFromSomeoneElsesRequest() {
        RacePlayer requester = fixture.racing(1L, 500.0, 1.0, ANCHOR);
        RacePlayer hidden = fixture.racing(2L, 600.0, 1.0, ANCHOR);
        fixture.requester(requester);
        fixture.online(requester);
        fixture.absent(hidden, ANCHOR);

        StudentRaceFinishArbitrationResponse response = fixture.arbitrate();

        assertEquals(504.0, requester.getPosition(), 1e-9);
        assertEquals(600.0, hidden.getPosition(), 1e-9);
        assertEquals(ANCHOR, hidden.getMovementUpdatedAtEpochMs());
        assertEquals(ANCHOR, response.getSnapshot().getOpponents().get(0).getPositionAtEpochMs());
        assertEquals(T, response.getSnapshot().getPositionAtEpochMs());
        verify(fixture.presenceService).recordGameplayActivity(requester, NOW);
        verify(fixture.presenceService, never()).recordGameplayActivity(hidden, NOW);
        verify(fixture.presenceService, never()).renewPresenceLease(any(), any());
    }

    private List<Long> confirmedIds(StudentRaceFinishArbitrationResponse response) {
        return response.getFinishOrder().getConfirmedFinishers().stream()
                .map(StudentRaceConfirmedFinisherResponse::getRacePlayerId)
                .toList();
    }

    private List<Integer> confirmedRanks(StudentRaceFinishArbitrationResponse response) {
        return response.getFinishOrder().getConfirmedFinishers().stream()
                .map(StudentRaceConfirmedFinisherResponse::getRank)
                .toList();
    }
}
