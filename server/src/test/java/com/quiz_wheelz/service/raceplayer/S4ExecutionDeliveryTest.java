package com.quiz_wheelz.service.raceplayer;

import com.quiz_wheelz.enums.*;
import com.quiz_wheelz.exception.*;
import com.quiz_wheelz.utils.DateTimeUtils;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;

import static org.junit.jupiter.api.Assertions.*;

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
