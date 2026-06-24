package com.quiz_wheelz.service.question;

import com.quiz_wheelz.common.QuestionRules;
import com.quiz_wheelz.dto.question.GeneratedQuestionChoice;
import com.quiz_wheelz.dto.question.MathQuestionData;
import com.quiz_wheelz.exception.ApiException;
import com.quiz_wheelz.exception.ErrorCode;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Random;
import java.util.Set;

@Service
public class AnswerChoiceGenerator {

    private final Random random;

    public AnswerChoiceGenerator() {
        this(new Random());
    }

    AnswerChoiceGenerator(Random random) {
        this.random = random;
    }

    public List<GeneratedQuestionChoice> generateChoices(
            MathQuestionData questionData,
            Integer choicesCount
    ) {
        validateInput(questionData, choicesCount);

        Integer correctAnswer = questionData.getCorrectAnswerValue();

        Set<Integer> answerValues = new LinkedHashSet<>();
        answerValues.add(correctAnswer);

        addPreferredDistractors(
                answerValues,
                questionData.getPreferredDistractorValues(),
                correctAnswer,
                choicesCount
        );

        addRandomDistractors(
                answerValues,
                correctAnswer,
                choicesCount
        );

        addSequentialFallbackDistractors(
                answerValues,
                correctAnswer,
                choicesCount
        );

        if (answerValues.size() < choicesCount) {
            throw new ApiException(ErrorCode.QUESTION_GENERATION_FAILED);
        }

        return buildShuffledChoices(answerValues, correctAnswer);
    }

    private void validateInput(
            MathQuestionData questionData,
            Integer choicesCount
    ) {
        if (questionData == null
                || questionData.getCorrectAnswerValue() == null
                || choicesCount == null) {
            throw new ApiException(ErrorCode.INVALID_QUESTION_TEMPLATE_CONFIG);
        }

        if (choicesCount < QuestionRules.MIN_CHOICES_COUNT
                || choicesCount > QuestionRules.MAX_CHOICES_COUNT) {
            throw new ApiException(ErrorCode.INVALID_QUESTION_TEMPLATE_CONFIG);
        }

        if (questionData.getCorrectAnswerValue() < QuestionRules.MIN_DISTRACTOR_VALUE) {
            throw new ApiException(ErrorCode.QUESTION_GENERATION_FAILED);
        }
    }

    private void addPreferredDistractors(
            Set<Integer> answerValues,
            List<Integer> preferredDistractorValues,
            Integer correctAnswer,
            Integer choicesCount
    ) {
        if (preferredDistractorValues == null || preferredDistractorValues.isEmpty()) {
            return;
        }

        for (Integer preferredDistractorValue : preferredDistractorValues) {
            if (answerValues.size() >= choicesCount) {
                return;
            }

            if (isValidDistractor(answerValues, preferredDistractorValue, correctAnswer)) {
                answerValues.add(preferredDistractorValue);
            }
        }
    }

    private void addRandomDistractors(
            Set<Integer> answerValues,
            Integer correctAnswer,
            Integer choicesCount
    ) {
        int attempts = 0;

        while (answerValues.size() < choicesCount
                && attempts < QuestionRules.MAX_DISTRACTOR_GENERATION_ATTEMPTS) {
            Integer candidate = randomDistractorCandidate(correctAnswer);

            if (isValidDistractor(answerValues, candidate, correctAnswer)) {
                answerValues.add(candidate);
            }

            attempts++;
        }
    }

    private Integer randomDistractorCandidate(Integer correctAnswer) {
        int window = calculateDistractorWindow(correctAnswer);
        int distance = random.nextInt(window) + QuestionRules.MIN_DISTRACTOR_OFFSET;
        boolean shouldAdd = random.nextBoolean();

        if (shouldAdd) {
            return correctAnswer + distance;
        }

        return correctAnswer - distance;
    }

    private int calculateDistractorWindow(Integer correctAnswer) {
        int scaledWindow = correctAnswer / QuestionRules.DISTRACTOR_WINDOW_DIVISOR
                + QuestionRules.DISTRACTOR_WINDOW_PADDING;

        return Math.clamp(scaledWindow, QuestionRules.MIN_DISTRACTOR_WINDOW,
                QuestionRules.MAX_DISTRACTOR_WINDOW);
    }

    private void addSequentialFallbackDistractors(
            Set<Integer> answerValues,
            Integer correctAnswer,
            Integer choicesCount
    ) {
        int maxFallbackDistance = QuestionRules.MAX_DISTRACTOR_WINDOW
                + QuestionRules.MAX_CHOICES_COUNT;

        for (int distance = QuestionRules.MIN_DISTRACTOR_OFFSET;
             answerValues.size() < choicesCount && distance <= maxFallbackDistance;
             distance++) {
            Integer lowerCandidate = correctAnswer - distance;

            if (isValidDistractor(answerValues, lowerCandidate, correctAnswer)) {
                answerValues.add(lowerCandidate);
            }

            if (answerValues.size() >= choicesCount) {
                return;
            }

            Integer upperCandidate = correctAnswer + distance;

            if (isValidDistractor(answerValues, upperCandidate, correctAnswer)) {
                answerValues.add(upperCandidate);
            }
        }
    }

    private boolean isValidDistractor(
            Set<Integer> answerValues,
            Integer candidate,
            Integer correctAnswer
    ) {
        return candidate != null
                && candidate >= QuestionRules.MIN_DISTRACTOR_VALUE
                && !candidate.equals(correctAnswer)
                && !answerValues.contains(candidate);
    }

    private List<GeneratedQuestionChoice> buildShuffledChoices(
            Set<Integer> answerValues,
            Integer correctAnswer
    ) {
        List<Integer> shuffledAnswerValues = new ArrayList<>(answerValues);
        Collections.shuffle(shuffledAnswerValues, random);

        List<GeneratedQuestionChoice> choices = new ArrayList<>();

        for (int index = 0; index < shuffledAnswerValues.size(); index++) {
            Integer answerValue = shuffledAnswerValues.get(index);

            choices.add(new GeneratedQuestionChoice(
                    String.valueOf(answerValue),
                    answerValue,
                    answerValue.equals(correctAnswer),
                    index + QuestionRules.FIRST_DISPLAY_ORDER
            ));
        }

        return choices;
    }
}
