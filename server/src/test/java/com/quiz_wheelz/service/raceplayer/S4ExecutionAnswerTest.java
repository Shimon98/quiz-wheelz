package com.quiz_wheelz.service.raceplayer;

import com.quiz_wheelz.dto.raceplayer.StudentChallengeChoiceRequest;
import com.quiz_wheelz.enums.*;
import com.quiz_wheelz.exception.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import static org.junit.jupiter.api.Assertions.*;

class S4ExecutionAnswerTest extends S4ExecutionIntegrationFixture {
    @ParameterizedTest
    @ValueSource(booleans = {true, false})
    void turboResolvesExactlyOnceAndKeepsLearningState(boolean correct) {
        select(ChallengeChoice.TURBO_TRIAL);
        var before = learning();
        var response = answer(correct);
        assertEquals(correct ? 40 : 0, response.getRaceImpact().getScoreDelta());
        assertEquals(correct ? 80.0 : 0.0, response.getRaceImpact().getProgressDelta());
        assertFalse(response.getRaceImpact().isDifficultyChanged());
        assertEquals(before, learning());
        var offer = offer(executionId);
        assertEquals(1, offer.getQuestionsResolved());
        assertEquals(correct ? 1 : 0, offer.getCorrectAnswers());
        assertEquals(correct ? ChallengeOutcome.TURBO_SUCCESS : ChallengeOutcome.TURBO_FAILURE, offer.getOutcome());
        assertEquals(T, offer.getExecutionEndedAtEpochMs());
        var gameplay = response.getRaceImpact().getSnapshot().getGameplay();
        assertEquals(RacePlayerGameplayMode.NORMAL, gameplay.mode());
        assertNull(gameplay.challenge().run());
        assertEquals(offer.getOutcome(), gameplay.challenge().lastResult().outcome());
        assertEquals(correct ? 0 : 1, gameplay.activeEffects().size());
        if (!correct) {
            var effect = gameplay.activeEffects().getFirst();
            assertEquals(EffectSource.TURBO_FAILURE, effect.source());
            assertEquals(2, effect.magnitudeTenths());
            assertEquals(T, effect.startsAtEpochMs());
            assertEquals(T + 4000, effect.endsAtEpochMs());
        }
        var duplicate = new com.quiz_wheelz.dto.answer.SubmitAnswerRequest();
        duplicate.setQuestionId(response.getQuestionId());
        duplicate.setChoiceId(response.getSelectedChoiceId());
        assertEquals(ErrorCode.QUESTION_NOT_ACTIVE, assertThrows(ApiException.class,
                () -> answerService.submitAnswer(second(), duplicate)).getErrorCode());
        assertEquals(1, offer(executionId).getQuestionsResolved());
        assertEquals(T, choiceService.choose(secondRequest,
                new StudentChallengeChoiceRequest(executionId, "TURBO_TRIAL")).selectedAtEpochMs());
        assertEquals(ErrorCode.CHALLENGE_CHOICE_CONFLICT, assertThrows(ApiException.class,
                () -> choiceService.choose(secondRequest,
                        new StudentChallengeChoiceRequest(executionId, "SAFE_RUN"))).getErrorCode());
    }

    @ParameterizedTest
    @ValueSource(ints = {0, 1, 2, 3})
    void safeSequenceRewardsOnlyCorrectAnswersAndPerfectBonus(int correctCount) {
        select(ChallengeChoice.SAFE_RUN);
        var before = learning();
        int score = 0;
        double progress = 0;
        for (int index = 0; index < 3; index++) {
            var response = answer(index < correctCount);
            score += response.getRaceImpact().getScoreDelta();
            progress += response.getRaceImpact().getProgressDelta();
            assertEquals(before, learning());
            assertFalse(response.getRaceImpact().isDifficultyChanged());
            assertTrue(response.getRaceImpact().getSnapshot().getGameplay().activeEffects().isEmpty());
            if (index < 2) {
                assertNull(offer(executionId).getOutcome());
                assertEquals(RacePlayerGameplayMode.SAFE_RUN, snapshot().getGameplay().mode());
                assertEquals(index + 1, snapshot().getGameplay().challenge().run().questionsResolved());
            } else if (correctCount == 3) {
                assertEquals(14, response.getRaceImpact().getScoreDelta());
                assertEquals(25.0, response.getRaceImpact().getProgressDelta());
            }
        }
        assertEquals(correctCount * 8 + (correctCount == 3 ? 6 : 0), score);
        assertEquals(correctCount * 15.0 + (correctCount == 3 ? 10 : 0), progress);
        assertEquals(correctCount, offer(executionId).getCorrectAnswers());
        assertEquals(3, offer(executionId).getQuestionsResolved());
        assertEquals(correctCount == 3 ? ChallengeOutcome.SAFE_PERFECT : ChallengeOutcome.SAFE_COMPLETE,
                snapshot().getGameplay().challenge().lastResult().outcome());
        assertEquals(RacePlayerGameplayMode.NORMAL, snapshot().getGameplay().mode());
        assertNull(snapshot().getGameplay().challenge().run());
        assertEquals(T, choiceService.choose(secondRequest,
                new StudentChallengeChoiceRequest(executionId, "SAFE_RUN")).selectedAtEpochMs());
        assertEquals(ErrorCode.CHALLENGE_CHOICE_CONFLICT, assertThrows(ApiException.class,
                () -> choiceService.choose(secondRequest,
                        new StudentChallengeChoiceRequest(executionId, "TURBO_TRIAL"))).getErrorCode());
    }

    @Test
    void turboRewardCompletesBeforeFinishAndClampsPosition() {
        select(ChallengeChoice.TURBO_TRIAL);
        secondPosition(950);
        var response = answer(true);
        assertEquals(80.0, response.getRaceImpact().getProgressDelta());
        assertEquals(1000.0, response.getRaceImpact().getSnapshot().getPosition());
        assertEquals(RacePlayerStatus.FINISHED, second().getStatus());
        assertEquals(ChallengeOutcome.TURBO_SUCCESS, offer(executionId).getOutcome());
        assertEquals(ChallengeOutcome.TURBO_SUCCESS, snapshot().getGameplay().challenge().lastResult().outcome());
    }

    @ParameterizedTest
    @ValueSource(ints = {1, 2, 3})
    void safeRewardPreservedAndOnlyUnfinishedSequenceAborts(int finishQuestion) {
        select(ChallengeChoice.SAFE_RUN);
        for (int index = 1; index < finishQuestion; index++) {
            answer(true);
        }
        secondPosition(995);
        var response = answer(true);
        assertEquals(finishQuestion == 3 ? 14 : 8, response.getRaceImpact().getScoreDelta());
        assertEquals(finishQuestion == 3 ? 25.0 : 15.0, response.getRaceImpact().getProgressDelta());
        assertEquals(1000.0, second().getPosition());
        assertEquals(RacePlayerStatus.FINISHED, second().getStatus());
        assertEquals(T, offer(executionId).getExecutionEndedAtEpochMs());
        assertEquals(finishQuestion == 3 ? ChallengeOutcome.SAFE_PERFECT : null, offer(executionId).getOutcome());
        assertEquals(ChallengeOfferStatus.SELECTED, offer(executionId).getStatus());
    }
}
