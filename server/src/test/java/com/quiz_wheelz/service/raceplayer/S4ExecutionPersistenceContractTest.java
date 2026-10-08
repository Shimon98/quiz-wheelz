package com.quiz_wheelz.service.raceplayer;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.quiz_wheelz.dto.raceplayer.StudentChallengeChoiceRequest;
import com.quiz_wheelz.enums.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import java.util.HashSet;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

class S4ExecutionPersistenceContractTest extends S4ExecutionIntegrationFixture {
    @ParameterizedTest
    @ValueSource(strings = {"questions_resolved=-1", "correct_answers=-1", "correct_answers=1",
            "questions_resolved=1", "outcome='TURBO_SUCCESS'", "questions_resolved=2",
            "questions_resolved=1, execution_ended_at_epoch_ms=1, outcome='SAFE_COMPLETE'",
            "questions_resolved=1, execution_ended_at_epoch_ms=1, outcome='TURBO_SUCCESS'"})
    void invalidTurboCountersAndOutcomesFailAtDatabase(String assignments) {
        select(ChallengeChoice.TURBO_TRIAL);
        assertThrows(RuntimeException.class, () -> transactions.executeWithoutResult(status -> entityManager
                .createNativeQuery("update race_player_challenge_offers set " + assignments + " where id=:id")
                .setParameter("id", executionId).executeUpdate()));
        assertEquals(0, offer(executionId).getQuestionsResolved());
        assertNull(offer(executionId).getOutcome());
    }

    @ParameterizedTest
    @ValueSource(strings = {"questions_resolved=4", "questions_resolved=3",
            "questions_resolved=3, execution_ended_at_epoch_ms=1, outcome='SAFE_PERFECT'",
            "questions_resolved=3, correct_answers=3, execution_ended_at_epoch_ms=1, outcome='SAFE_COMPLETE'",
            "questions_resolved=1, execution_ended_at_epoch_ms=1, outcome='TURBO_FAILURE'"})
    void invalidSafeCompletionFailsAtDatabase(String assignments) {
        select(ChallengeChoice.SAFE_RUN);
        assertThrows(RuntimeException.class, () -> transactions.executeWithoutResult(status -> entityManager
                .createNativeQuery("update race_player_challenge_offers set " + assignments + " where id=:id")
                .setParameter("id", executionId).executeUpdate()));
    }

    @Test
    void questionContextLinkConstraintRejectsBothMismatchDirectionsAndForeignKey() {
        select(ChallengeChoice.TURBO_TRIAL);
        Long id = current().getQuestionId();
        for (String assignment : new String[]{"challenge_offer_id=null", "gameplay_context='NORMAL'",
                "challenge_offer_id=9223372036854775807"}) {
            assertThrows(RuntimeException.class, () -> transactions.executeWithoutResult(status -> entityManager
                    .createNativeQuery("update player_questions set " + assignment + " where id=:id")
                    .setParameter("id", id).executeUpdate()));
        }
    }

    @Test
    void publicFieldsAreExactForRunResultAndTerminalHistory() {
        select(ChallengeChoice.TURBO_TRIAL);
        var mapper = new ObjectMapper();
        JsonNode challenge = mapper.valueToTree(snapshot().getGameplay().challenge());
        assertEquals(Set.of("energy", "threshold", "offer", "run", "lastResult"), names(challenge));
        assertEquals(Set.of("challengeId", "type", "questionsResolved", "totalQuestions", "correctAnswers"),
                names(challenge.get("run")));
        assertTrue(challenge.get("offer").isNull());
        assertTrue(challenge.get("lastResult").isNull());
        answer(true);
        challenge = mapper.valueToTree(snapshot().getGameplay().challenge());
        assertTrue(challenge.get("run").isNull());
        assertEquals(Set.of("challengeId", "type", "outcome", "questionsResolved", "correctAnswers",
                "completedAtEpochMs"), names(challenge.get("lastResult")));
        assertEquals(executionId.longValue(), challenge.get("lastResult").get("challengeId").asLong());
    }

    @Test
    void laterAbortDoesNotReplacePreviousCompletedResultAndProjectionDoesNotMutateHistory() {
        select(ChallengeChoice.TURBO_TRIAL);
        answer(true);
        Long completed = executionId;
        var original = offer(completed);
        transactions.executeWithoutResult(status -> {
            var later = new com.quiz_wheelz.entitys.RacePlayerChallengeOffer();
            later.setRacePlayer(locked());
            later.setStatus(ChallengeOfferStatus.SELECTED);
            later.setChoice(ChallengeChoice.SAFE_RUN);
            later.setOfferedAtEpochMs(T + 1);
            later.setExpiresAtEpochMs(T + 12001);
            later.setResolvedAtEpochMs(T + 1);
            offerRepository.save(later);
            executionId = later.getId();
        });
        transactions.executeWithoutResult(status -> locked().setStatus(RacePlayerStatus.FINISHED));
        clock.set(T + 1000);
        var state = snapshot();
        assertNull(offer(executionId).getOutcome());
        assertEquals(completed, state.getGameplay().challenge().lastResult().challengeId());
        assertEquals(original.getExecutionEndedAtEpochMs(), offer(completed).getExecutionEndedAtEpochMs());
        assertEquals(T + 1, choiceService.choose(secondRequest,
                new StudentChallengeChoiceRequest(executionId, "SAFE_RUN")).selectedAtEpochMs());
        var ended = offer(executionId).getExecutionEndedAtEpochMs();
        snapshot();
        assertEquals(ended, offer(executionId).getExecutionEndedAtEpochMs());
    }

    @Test
    void executionRollbackRestoresCountersQuestionAndReward() {
        select(ChallengeChoice.TURBO_TRIAL);
        var current = current();
        double position = second().getPosition();
        int score = second().getScore();
        transactions.executeWithoutResult(status -> {
            answer(true);
            status.setRollbackOnly();
        });
        assertNull(offer(executionId).getOutcome());
        assertEquals(0, offer(executionId).getQuestionsResolved());
        assertEquals(score, second().getScore());
        assertEquals(position, second().getPosition());
        assertEquals(current.getQuestionId(), current().getQuestionId());
    }

    private Set<String> names(JsonNode node) {
        var result = new HashSet<String>();
        node.fieldNames().forEachRemaining(result::add);
        return result;
    }
}
