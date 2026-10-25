package com.quiz_wheelz.service.raceplayer;

import com.quiz_wheelz.common.ChallengeRules;
import com.quiz_wheelz.entitys.*;
import com.quiz_wheelz.enums.*;
import com.quiz_wheelz.exception.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.function.Consumer;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.*;

class S4ChallengeRecoveryTest extends S4ChallengeFlowFixture {
    @Test
    void turboRunLeftWithoutAValidTemplateEndsNeutrallyRefundsOnceAndContinuesWithANormalQuestion() {
        select(ChallengeChoice.TURBO_TRIAL);
        var before = rewards();
        templatesOf(Difficulty.HARD, template -> {
            template.setMinValue(50);
            template.setMaxValue(10);
        });

        var question = current();

        assertEquals(QuestionGameplayContext.NORMAL, question.getGameplayContext());
        assertEndedTechnically(0);
        assertEquals(before, rewards());
        energy(30);
        assertEquals(question.getQuestionId(), current().getQuestionId());
        assertEquals(30, energy());
    }

    @Test
    void generatorFailureOnATemplateThatPassedValidationNeverPoisonsTheRequest() {
        select(ChallengeChoice.TURBO_TRIAL);
        templatesOf(Difficulty.HARD, template -> {
            template.setMinValue(50);
            template.setMaxValue(60);
        });

        assertEquals(QuestionGameplayContext.NORMAL, current().getGameplayContext());
        assertEndedTechnically(0);
    }

    @Test
    void templateThatFailsAtGenerationGivesWayToAHealthyOneWithoutEndingTheRun() {
        transactions.executeWithoutResult(status -> entityManager.persist(copyOf(activeTemplates(Difficulty.HARD)
                .getFirst(), QuestionType.ORDER_OF_OPERATIONS)));
        select(ChallengeChoice.TURBO_TRIAL);
        int triedFirst = Math.floorMod(executionId, 2);
        transactions.executeWithoutResult(status -> {
            var broken = activeTemplates(Difficulty.HARD).get(triedFirst);
            broken.setMinValue(50);
            broken.setMaxValue(60);
        });

        assertEquals(QuestionGameplayContext.TURBO_TRIAL, current().getGameplayContext());
        assertNull(offer(executionId).getExecutionEndedAtEpochMs());
        assertEquals(0, energy());
    }

    static Stream<Arguments> normalBreakages() {
        Consumer<QuestionTemplate> malformed = template -> {
            template.setMinValue(50);
            template.setMaxValue(10);
        };
        Consumer<QuestionTemplate> repaired = template -> {
            template.setMinValue(1);
            template.setMaxValue(10);
        };
        Consumer<QuestionTemplate> inactive = template -> template.setActive(false);
        Consumer<QuestionTemplate> active = template -> template.setActive(true);
        return Stream.of(Arguments.of("a malformed template", malformed, repaired),
                Arguments.of("no active template", inactive, active));
    }

    @ParameterizedTest(name = "{0}")
    @MethodSource("normalBreakages")
    void normalQuestionFailureAfterTheAbortKeepsTheAbortAndTheRefund(String name, Consumer<QuestionTemplate> breakNormal,
                                                                     Consumer<QuestionTemplate> repairNormal) {
        select(ChallengeChoice.TURBO_TRIAL);
        templatesOf(Difficulty.HARD, template -> {
            template.setMinValue(50);
            template.setMaxValue(10);
        });
        templatesOf(Difficulty.EASY, breakNormal);

        assertEquals(ErrorCode.QUESTION_TEMPLATE_NOT_AVAILABLE_FOR_PLAYER,
                assertThrows(ApiException.class, this::current).getErrorCode());

        assertEndedTechnically(0);
        templatesOf(Difficulty.EASY, repairNormal);
        energy(30);
        assertEquals(QuestionGameplayContext.NORMAL, current().getGameplayContext());
        assertEquals(30, energy());
    }

    @Test
    void endedRunFallsBackToTheNextNormalTemplateWhenTheOneInTurnIsBroken() {
        var next = activeTemplates(Difficulty.EASY).getFirst();
        var inTurn = persisted(copyOf(next, QuestionType.SUBTRACTION));
        select(ChallengeChoice.TURBO_TRIAL);
        templatesOf(Difficulty.HARD, template -> {
            template.setMinValue(50);
            template.setMaxValue(10);
        });
        change(inTurn, template -> {
            template.setMinValue(50);
            template.setMaxValue(10);
        });

        var question = current();

        assertEquals(QuestionGameplayContext.NORMAL, question.getGameplayContext());
        assertEquals(next.getId(), templateOf(question));
        assertEndedTechnically(0);
    }

    @Test
    void safeRunCutShortAfterACorrectAnswerKeepsThatRewardAndShowsNoResult() {
        transactions.executeWithoutResult(status -> entityManager.persist(copyOf(activeTemplates(Difficulty.EASY)
                .getFirst(), QuestionType.MULTIPLICATION)));
        select(ChallengeChoice.SAFE_RUN);
        answer(true);
        var after = rewards();
        transactions.executeWithoutResult(status -> activeTemplates(Difficulty.EASY).stream()
                .filter(template -> template.getType() == QuestionType.ADDITION)
                .forEach(template -> template.setActive(false)));

        assertEquals(QuestionGameplayContext.NORMAL, current().getGameplayContext());
        assertEndedTechnically(1);
        assertEquals(1, offer(executionId).getCorrectAnswers());
        assertEquals(after, rewards());
    }

    @Test
    void concurrentRequestsEndTheRunOnceAndShareOneNormalQuestion() throws Exception {
        select(ChallengeChoice.TURBO_TRIAL);
        templatesOf(Difficulty.HARD, template -> {
            template.setMinValue(50);
            template.setMaxValue(10);
        });
        try (var pool = Executors.newFixedThreadPool(2)) {
            var start = new CountDownLatch(1);
            var first = pool.submit(() -> {
                start.await();
                return current();
            });
            var second = pool.submit(() -> {
                start.await();
                return current();
            });
            start.countDown();
            assertEquals(first.get(15, TimeUnit.SECONDS).getQuestionId(),
                    second.get(15, TimeUnit.SECONDS).getQuestionId());
        }
        assertEquals(1L, activeQuestions());
        assertEndedTechnically(0);
    }

    @Test
    void finishedRaceEndsTheRunWithoutATechnicalRefund() {
        select(ChallengeChoice.TURBO_TRIAL);
        templatesOf(Difficulty.HARD, template -> {
            template.setMinValue(50);
            template.setMaxValue(10);
        });
        transactions.executeWithoutResult(status -> {
            var race = raceRepository.findById(raceId).orElseThrow();
            race.setStatus(RaceStatus.FINISHED);
            race.setFinishedAt(local(T));
        });

        assertEquals(ErrorCode.RACE_NOT_IN_PROGRESS, assertThrows(ApiException.class, this::current).getErrorCode());
        assertEquals(0, energy());
        var ended = offer(executionId);
        assertNotNull(ended.getExecutionEndedAtEpochMs());
        assertNull(ended.getOutcome());
    }

    @Test
    void templatesThatCanNeverGenerateAQuestionNeverMakeAnOffer() {
        templatesOf(Difficulty.HARD, template -> {
            template.setMinValue(50);
            template.setMaxValue(60);
        });
        energy(80);

        assertNull(answerSecond().getRaceImpact().getSnapshot().getGameplay().challenge().offer());

        assertEquals(ChallengeRules.ENERGY_THRESHOLD, energy());
        assertTrue(transactions.<Boolean>execute(status -> offers.unresolved(locked()).isEmpty()));
    }

    static Stream<Arguments> turboBreakages() {
        Consumer<QuestionTemplate> malformed = template -> {
            template.setMinValue(50);
            template.setMaxValue(10);
        };
        Consumer<QuestionTemplate> neverGenerates = template -> {
            template.setMinValue(50);
            template.setMaxValue(60);
        };
        return Stream.of(Arguments.of("malformed", malformed), Arguments.of("unable to generate", neverGenerates));
    }

    @ParameterizedTest(name = "{0}")
    @MethodSource("turboBreakages")
    void noOfferIsRenewedWhileTheChosenSideStaysBroken(String name, Consumer<QuestionTemplate> breakTurbo) {
        select(ChallengeChoice.TURBO_TRIAL);
        templatesOf(Difficulty.HARD, breakTurbo);
        current();

        var snapshot = answer(true).getRaceImpact().getSnapshot();

        assertNull(snapshot.getGameplay().challenge().offer());
        assertEquals(ChallengeRules.ENERGY_THRESHOLD, energy());
        assertTrue(transactions.<Boolean>execute(status -> offers.unresolved(locked()).isEmpty()));
    }

    @ParameterizedTest(name = "{0}")
    @MethodSource("normalBreakages")
    void normalQuestionFailureReachesTheStudentAsItsOwnErrorAndLeavesNoQuestionBehind(
            String name, Consumer<QuestionTemplate> breakNormal, Consumer<QuestionTemplate> repairNormal) {
        answerSecond();
        templatesOf(Difficulty.EASY, breakNormal);

        assertEquals(ErrorCode.QUESTION_TEMPLATE_NOT_AVAILABLE_FOR_PLAYER,
                assertThrows(ApiException.class, this::current).getErrorCode());

        assertEquals(0L, activeQuestions());
    }

    private void assertEndedTechnically(int questionsResolved) {
        var ended = offer(executionId);
        assertEquals(ChallengeOfferStatus.SELECTED, ended.getStatus());
        assertEquals(T, ended.getExecutionEndedAtEpochMs());
        assertNull(ended.getOutcome());
        assertEquals(questionsResolved, ended.getQuestionsResolved());
        assertEquals(ChallengeRules.ENERGY_THRESHOLD, energy());
        assertTrue(transactions.<Boolean>execute(status -> offers.unresolved(locked()).isEmpty()));
        assertEquals(0L, transactions.<Long>execute(status -> entityManager.createQuery(
                "select count(q) from PlayerQuestion q where q.racePlayer.id = :id and q.status = :status "
                        + "and q.gameplayContext <> :normal", Long.class)
                .setParameter("id", secondId).setParameter("status", PlayerQuestionStatus.ACTIVE)
                .setParameter("normal", QuestionGameplayContext.NORMAL).getSingleResult()));
        var gameplay = snapshot().getGameplay();
        assertEquals(RacePlayerGameplayMode.NORMAL, gameplay.mode());
        assertNull(gameplay.challenge().run());
        assertNull(gameplay.challenge().lastResult());
    }
}
