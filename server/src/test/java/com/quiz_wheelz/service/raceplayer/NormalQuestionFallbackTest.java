package com.quiz_wheelz.service.raceplayer;

import com.quiz_wheelz.entitys.*;
import com.quiz_wheelz.enums.*;
import com.quiz_wheelz.exception.*;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.function.Consumer;

import static org.junit.jupiter.api.Assertions.*;

class NormalQuestionFallbackTest extends S4ChallengeFlowFixture {
    private static final Consumer<QuestionTemplate> MALFORMED = template -> {
        template.setMinValue(50);
        template.setMaxValue(10);
    };
    private static final Consumer<QuestionTemplate> UNABLE_TO_GENERATE = template -> {
        template.setMinValue(50);
        template.setMaxValue(60);
    };

    @Test
    void brokenTemplateInTurnGivesWayToTheNextOneOfTheSameSubjectAndLevel() {
        var next = activeTemplates(Difficulty.EASY).getFirst();
        var inTurn = persisted(copyOf(next, QuestionType.SUBTRACTION));
        answerSecond();
        change(inTurn, MALFORMED);

        var question = current();

        assertEquals(QuestionGameplayContext.NORMAL, question.getGameplayContext());
        assertEquals(next.getId(), templateOf(question));
        assertEquals(next.getTimeLimitSeconds(), question.getTimeLimitSeconds());
        assertEquals(next.getChoicesCount(), question.getChoices().size());
        assertEquals(1L, activeQuestions());
    }

    @Test
    void healthyTemplatesKeepTheirFairTurn() {
        var first = activeTemplates(Difficulty.EASY).getFirst();
        var inTurn = persisted(copyOf(first, QuestionType.SUBTRACTION));
        answerSecond();

        assertEquals(inTurn.getId(), templateOf(current()));
        answer(false);
        assertEquals(first.getId(), templateOf(current()));
    }

    @Test
    void questionComesFromTheTemplateInTurnEvenWhenAnotherOneLooksTheSame() {
        var inTurn = copyOf(activeTemplates(Difficulty.EASY).getFirst(), QuestionType.ADDITION);
        inTurn.setMinValue(20);
        inTurn.setMaxValue(30);
        persisted(inTurn);
        answerSecond();

        assertEquals(inTurn.getId(), templateOf(current()));
    }

    @Test
    void templateThatPassesValidationButCannotBeGeneratedGivesWayToTheNextOne() {
        var next = activeTemplates(Difficulty.HARD).getFirst();
        var inTurn = copyOf(next, QuestionType.ORDER_OF_OPERATIONS);
        inTurn.setGenerationPattern(QuestionGenerationPattern.ADD_MULTIPLY_SUBTRACT);
        UNABLE_TO_GENERATE.accept(inTurn);
        persisted(inTurn);
        answerSecond();
        hard();

        assertEquals(next.getId(), templateOf(current()));
    }

    @Test
    void everyBrokenTemplateEndsInTheDomainErrorWithoutBorrowingAnotherLevelOrSubject() {
        persisted(copyOf(activeTemplates(Difficulty.EASY).getFirst(), QuestionType.SUBTRACTION));
        healthyTemplateOfAnotherSubject();
        answerSecond();
        templatesOf(Difficulty.EASY, MALFORMED);
        var before = List.of(rewards(), energy(), questionCount());

        assertEquals(ErrorCode.QUESTION_TEMPLATE_NOT_AVAILABLE_FOR_PLAYER,
                assertThrows(ApiException.class, this::current).getErrorCode());

        assertEquals(before, List.of(rewards(), energy(), questionCount()));
        assertEquals(0L, activeQuestions());
        templatesOf(Difficulty.EASY, template -> {
            template.setMinValue(1);
            template.setMaxValue(10);
        });
        assertEquals(QuestionGameplayContext.NORMAL, current().getGameplayContext());
    }

    @Test
    void templatesTheGeneratorCannotUseEndInTheDomainErrorInsteadOfAServerError() {
        answerSecond();
        hard();
        templatesOf(Difficulty.HARD, UNABLE_TO_GENERATE);

        assertEquals(ErrorCode.QUESTION_TEMPLATE_NOT_AVAILABLE_FOR_PLAYER,
                assertThrows(ApiException.class, this::current).getErrorCode());
        assertEquals(0L, activeQuestions());
    }

    @Test
    void parallelRequestsShareOneQuestionWhenTheTemplateInTurnIsBroken() throws Exception {
        var inTurn = persisted(copyOf(activeTemplates(Difficulty.EASY).getFirst(), QuestionType.SUBTRACTION));
        answerSecond();
        change(inTurn, MALFORMED);
        try (var pool = Executors.newFixedThreadPool(2)) {
            var start = new CountDownLatch(1);
            var first = pool.submit(() -> {
                start.await();
                return current();
            });
            var other = pool.submit(() -> {
                start.await();
                return current();
            });
            start.countDown();
            assertEquals(first.get(15, TimeUnit.SECONDS).getQuestionId(),
                    other.get(15, TimeUnit.SECONDS).getQuestionId());
        }
        assertEquals(1L, activeQuestions());
        assertEquals(2L, questionCount());
    }

    @Test
    void refreshReturnsTheFallbackQuestionInsteadOfMakingAnother() {
        var inTurn = persisted(copyOf(activeTemplates(Difficulty.EASY).getFirst(), QuestionType.SUBTRACTION));
        answerSecond();
        change(inTurn, MALFORMED);
        var question = current();

        assertEquals(question.getQuestionId(), current().getQuestionId());
        assertEquals(2L, questionCount());
    }

    private void hard() {
        transactions.executeWithoutResult(status -> playerRepository.findById(secondId).orElseThrow()
                .setCurrentDifficulty(Difficulty.HARD));
    }

    private long questionCount() {
        return transactions.<Long>execute(status -> entityManager.createQuery(
                "select count(q) from PlayerQuestion q where q.racePlayer.id = :id", Long.class)
                .setParameter("id", secondId).getSingleResult());
    }

    private void healthyTemplateOfAnotherSubject() {
        transactions.executeWithoutResult(status -> {
            var subject = new Subject();
            subject.setName("Other Math " + raceId);
            subject.setCode("OTHER_" + raceId);
            entityManager.persist(subject);
            var template = copyOf(activeTemplates(Difficulty.EASY).getFirst(), QuestionType.ADDITION);
            template.setSubject(subject);
            entityManager.persist(template);
        });
    }
}
