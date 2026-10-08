package com.quiz_wheelz.service.raceplayer;

import com.quiz_wheelz.dto.raceplayer.StudentChallengeChoiceRequest;
import com.quiz_wheelz.enums.*;
import com.quiz_wheelz.exception.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

class S4ExecutionHistoryStateTest extends S4ExecutionIntegrationFixture {
    @Test
    void completedResultSurvivesNormalAnswerReconnectAndFinish() {
        select(ChallengeChoice.TURBO_TRIAL);
        answer(true);
        var result = snapshot().getGameplay().challenge().lastResult();
        normalGeneration();
        answer(true);
        assertEquals(result, snapshot().getGameplay().challenge().lastResult());
        when(redisPresenceService.isOnline(raceId, secondId)).thenReturn(false);
        clock.set(T + 2000);
        reconnect.reconnect(secondRequest);
        when(redisPresenceService.isOnline(raceId, secondId)).thenReturn(true);
        assertEquals(result, snapshot().getGameplay().challenge().lastResult());
        transactions.executeWithoutResult(status -> locked().setStatus(RacePlayerStatus.FINISHED));
        assertEquals(result, snapshot().getGameplay().challenge().lastResult());
        assertEquals(T, choiceService.choose(secondRequest,
                new StudentChallengeChoiceRequest(executionId, "TURBO_TRIAL")).selectedAtEpochMs());
    }

    @Test
    void laterCompletedResultReplacesEarlierResult() {
        select(ChallengeChoice.TURBO_TRIAL);
        answer(true);
        Long previous = executionId;
        transactions.executeWithoutResult(status -> {
            var later = new com.quiz_wheelz.entitys.RacePlayerChallengeOffer();
            later.setRacePlayer(locked());
            later.setStatus(ChallengeOfferStatus.SELECTED);
            later.setChoice(ChallengeChoice.SAFE_RUN);
            later.setOfferedAtEpochMs(T + 1);
            later.setExpiresAtEpochMs(T + 12001);
            later.setResolvedAtEpochMs(T + 1);
            later.setQuestionsResolved(2);
            later.setCorrectAnswers(2);
            offerRepository.save(later);
            executionId = later.getId();
        });
        clock.set(T + 1000);
        answer(true);
        assertEquals(executionId, snapshot().getGameplay().challenge().lastResult().challengeId());
        assertEquals(ChallengeOutcome.SAFE_PERFECT, snapshot().getGameplay().challenge().lastResult().outcome());
        assertEquals(ChallengeOutcome.TURBO_SUCCESS, offer(previous).getOutcome());
    }

    @ParameterizedTest
    @ValueSource(strings = {"SAFE_RUN", "NORMAL"})
    void incompatibleActiveQuestionContextReturns3038(String context) {
        select(ChallengeChoice.TURBO_TRIAL);
        var question = current();
        transactions.executeWithoutResult(status -> {
            var stored = questionRepository.findById(question.getQuestionId()).orElseThrow();
            stored.setGameplayContext(QuestionGameplayContext.valueOf(context));
            if (context.equals("NORMAL")) {
                stored.setChallengeOffer(null);
            }
        });
        assertEquals(ErrorCode.CHALLENGE_EXECUTION_STATE_INVALID,
                assertThrows(ApiException.class, this::current).getErrorCode());
    }

    @Test
    void completedSpecialQuestionCannotHideBehindAnotherActiveOffer() {
        select(ChallengeChoice.TURBO_TRIAL);
        var response = answer(true);
        transactions.executeWithoutResult(status -> {
            questionRepository.findById(response.getQuestionId()).orElseThrow().setStatus(PlayerQuestionStatus.ACTIVE);
            var later = new com.quiz_wheelz.entitys.RacePlayerChallengeOffer();
            later.setRacePlayer(locked());
            later.setOfferedAtEpochMs(T);
            later.setExpiresAtEpochMs(T + 12000);
            offerRepository.save(later);
        });
        assertEquals(ErrorCode.CHALLENGE_EXECUTION_STATE_INVALID,
                assertThrows(ApiException.class, this::current).getErrorCode());
    }

    @Test
    void corruptSpecialAnswerReturns3038WithoutLearningMutation() {
        select(ChallengeChoice.TURBO_TRIAL);
        var question = current();
        transactions.executeWithoutResult(status -> questionRepository.findById(question.getQuestionId())
                .orElseThrow().setGameplayContext(QuestionGameplayContext.SAFE_RUN));
        var before = learning();
        var body = new com.quiz_wheelz.dto.answer.SubmitAnswerRequest();
        body.setQuestionId(question.getQuestionId());
        body.setChoiceId(question.getChoices().getFirst().getChoiceId());
        assertEquals(ErrorCode.CHALLENGE_EXECUTION_STATE_INVALID,
                assertThrows(ApiException.class, () -> answerService.submitAnswer(second(), body)).getErrorCode());
        assertEquals(before, learning());
        assertEquals(0, offer(executionId).getQuestionsResolved());
    }

    @Test
    void terminalRaceAbortUsesItsPersistedFinishEpoch() {
        select(ChallengeChoice.SAFE_RUN);
        var question = current();
        transactions.executeWithoutResult(status -> {
            var race = raceRepository.findById(raceId).orElseThrow();
            race.setStatus(RaceStatus.FINISHED);
            race.setFinishedAt(local(T + 1500));
        });
        clock.set(T + 2000);
        snapshot();
        assertEquals(T + 1500, offer(executionId).getExecutionEndedAtEpochMs());
        assertNull(offer(executionId).getOutcome());
        assertEquals(PlayerQuestionStatus.EXPIRED, transactions.execute(status -> questionRepository
                .findById(question.getQuestionId()).orElseThrow().getStatus()));
    }
}
