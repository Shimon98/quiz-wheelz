package com.quiz_wheelz.service.raceplayer;

import com.quiz_wheelz.dto.question.internal.InternalGeneratedQuestion;
import com.quiz_wheelz.entitys.QuestionTemplate;
import com.quiz_wheelz.enums.*;
import com.quiz_wheelz.exception.*;
import com.quiz_wheelz.utils.DateTimeUtils;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.springframework.dao.QueryTimeoutException;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.doThrow;

class S4ExecutionDeliveryTest extends S4ExecutionIntegrationFixture {
    @ParameterizedTest
    @EnumSource(ChallengeChoice.class)
    void specialQuestionIsDurableRepeatSafeAndOverridesTimingOnly(ChallengeChoice choice) {
        select(choice);
        var before = learning();
        var first = current();
        assertEquals(first.getQuestionId(), current().getQuestionId());
        transactions.executeWithoutResult(status -> {
            var stored = questionRepository.findById(first.getQuestionId()).orElseThrow();
            assertEquals(QuestionGameplayContext.valueOf(choice.name()), stored.getGameplayContext());
            assertEquals(executionId, stored.getChallengeOffer().getId());
            assertEquals(15, stored.getTimeLimitSeconds());
            assertEquals(T + 15_000, DateTimeUtils.toEpochMilli(stored.getExpiresAt(), clock.getZone()));
            assertEquals(stored.getCreatedAt().plusSeconds(15), stored.getExpiresAt());
            assertEquals(choice == ChallengeChoice.TURBO_TRIAL ? Difficulty.HARD : Difficulty.EASY,
                    stored.getQuestionTemplate().getDifficulty());
            assertEquals(choice == ChallengeChoice.TURBO_TRIAL ? 45 : 30,
                    stored.getQuestionTemplate().getTimeLimitSeconds());
        });
        assertEquals(before, learning());
        var run = snapshot().getGameplay().challenge().run();
        assertEquals(executionId, run.challengeId());
        assertEquals(choice, run.type());
        assertEquals(choice == ChallengeChoice.TURBO_TRIAL ? 1 : 3, run.totalQuestions());
        assertEquals(0, run.questionsResolved());
    }

    @ParameterizedTest
    @EnumSource(value = Difficulty.class, names = {"EASY", "HARD"})
    void missingChoiceTemplateKeepsEnergyAndCreatesNoOffer(Difficulty missing) {
        transactions.executeWithoutResult(status -> templates.findBySubjectAndDifficultyAndActiveTrueOrderByIdAsc(
                locked().getRace().getSubject(), missing).forEach(template -> template.setActive(false)));
        energy(80);
        assertNull(answerSecond().getRaceImpact().getSnapshot().getGameplay().challenge().offer());
        assertEquals(100, energy());
        assertTrue(offersAbsent());
    }

    @ParameterizedTest
    @EnumSource(value = Difficulty.class, names = {"EASY", "HARD"})
    void malformedChoiceTemplateKeepsEnergyAndCreatesNoOffer(Difficulty malformed) {
        transactions.executeWithoutResult(status -> templates.findBySubjectAndDifficultyAndActiveTrueOrderByIdAsc(
                locked().getRace().getSubject(), malformed).forEach(template -> {
                    template.setMinValue(50);
                    template.setMaxValue(10);
                }));
        energy(80);
        assertNull(answerSecond().getRaceImpact().getSnapshot().getGameplay().challenge().offer());
        assertEquals(100, energy());
        assertTrue(offersAbsent());
    }

    @Test
    void safeTemplateThatTurnsMalformedAfterTheChoiceIsSkippedWhileAHealthyOneRemains() {
        select(ChallengeChoice.SAFE_RUN);
        Long healthyId = transactions.execute(status -> {
            var original = questionRepository.findById(questionId).orElseThrow().getQuestionTemplate();
            var healthy = new QuestionTemplate();
            healthy.setSubject(original.getSubject());
            healthy.setType(QuestionType.SUBTRACTION);
            healthy.setDifficulty(Difficulty.EASY);
            healthy.setMinValue(original.getMinValue());
            healthy.setMaxValue(original.getMaxValue());
            healthy.setTimeLimitSeconds(original.getTimeLimitSeconds());
            healthy.setChoicesCount(original.getChoicesCount());
            entityManager.persist(healthy);
            original.setMinValue(50);
            original.setMaxValue(10);
            return healthy.getId();
        });
        var used = new ArrayList<Long>();
        for (int index = 0; index < 3; index++) {
            var question = current();
            used.add(transactions.execute(status -> questionRepository.findById(question.getQuestionId())
                    .orElseThrow().getQuestionTemplate().getId()));
            answer(true);
        }
        assertEquals(List.of(healthyId, healthyId, healthyId), used);
    }

    @Test
    void databaseFailureWhileGeneratingAChallengeQuestionIsNeverTreatedAsABrokenTemplate() {
        select(ChallengeChoice.TURBO_TRIAL);
        doThrow(new QueryTimeoutException("lock wait timeout")).when(generation).generateFromTemplate(any(), any(), any());

        assertThrows(QueryTimeoutException.class, this::current);
        assertNull(offer(executionId).getExecutionEndedAtEpochMs());
        assertEquals(0, energy());
    }

    @Test
    void unrelatedErrorWhileGeneratingAChallengeQuestionIsNeverTreatedAsABrokenTemplate() {
        select(ChallengeChoice.TURBO_TRIAL);
        doThrow(new ApiException(ErrorCode.CHALLENGE_EXECUTION_STATE_INVALID))
                .when(generation).generateFromTemplate(any(), any(), any());

        assertEquals(ErrorCode.CHALLENGE_EXECUTION_STATE_INVALID,
                assertThrows(ApiException.class, this::current).getErrorCode());
        assertNull(offer(executionId).getExecutionEndedAtEpochMs());
        assertEquals(0, energy());
    }

    @Test
    void rejectedNormalQuestionAfterTheAbortStillKeepsTheAbortAndTheRefund() {
        select(ChallengeChoice.TURBO_TRIAL);
        normalGeneration();
        var withoutChoices = transactions.execute(status -> {
            var template = questionRepository.findById(questionId).orElseThrow().getQuestionTemplate();
            return new InternalGeneratedQuestion(template.getSubject(), template, QuestionType.ADDITION,
                    Difficulty.EASY, "2 + 2", 4, 30, List.of());
        });
        doAnswer(invocation -> {
            if (invocation.<QuestionTemplate>getArgument(0).getDifficulty() == Difficulty.HARD) {
                throw new ApiException(ErrorCode.QUESTION_GENERATION_FAILED);
            }
            return withoutChoices;
        }).when(generation).generateFromTemplate(any(), any(), any());

        assertEquals(ErrorCode.INVALID_QUESTION_TEMPLATE_CONFIG,
                assertThrows(ApiException.class, this::current).getErrorCode());
        var ended = offer(executionId);
        assertNotNull(ended.getExecutionEndedAtEpochMs());
        assertNull(ended.getOutcome());
        assertEquals(100, energy());
    }

    private boolean offersAbsent() {
        return transactions.execute(status -> offers.unresolved(locked()).isEmpty());
    }

    @Test
    void threeSafeQuestionsAreLinkedAndThenNormalFlowResumes() {
        select(ChallengeChoice.SAFE_RUN);
        var ids = new java.util.HashSet<Long>();
        for (int index = 0; index < 3; index++) {
            ids.add(current().getQuestionId());
            answer(true);
        }
        assertEquals(3, ids.size());
        normalGeneration();
        assertEquals(QuestionGameplayContext.NORMAL, current().getGameplayContext());
        assertEquals(3, offer(executionId).getQuestionsResolved());
    }

    @Test
    void foreignSpecialOwnershipIsRejectedWithoutRepair() {
        select(ChallengeChoice.TURBO_TRIAL);
        var first = current();
        transactions.executeWithoutResult(status -> offerRepository.findById(executionId).orElseThrow()
                .setRacePlayer(playerRepository.findById(firstId).orElseThrow()));
        assertEquals(ErrorCode.CHALLENGE_EXECUTION_STATE_INVALID, assertThrows(ApiException.class,
                this::current).getErrorCode());
        assertEquals(PlayerQuestionStatus.ACTIVE, transactions.execute(status -> questionRepository
                .findById(first.getQuestionId()).orElseThrow().getStatus()));
    }
}
