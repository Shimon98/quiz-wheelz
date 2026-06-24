package com.quiz_wheelz.common;

import com.quiz_wheelz.enums.Difficulty;
import com.quiz_wheelz.enums.QuestionType;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;

import java.util.Map;
import java.util.Set;

@Getter
@Builder(access = AccessLevel.PACKAGE)
final class MathPatternRule {

    private final Set<Difficulty> allowedDifficulties;
    private final Set<QuestionType> allowedQuestionTypes;
    private final Map<QuestionType, Integer> maxMultiplicationOperatorCounts;
    private final Map<QuestionType, Integer> maxDivisionOperatorCounts;
    private final int maxMultiplicationFactor;
    private final int maxDivisionFactor;
    private final Map<Difficulty, Integer> maxCorrectAnswerValuesByDifficulty;
    private final boolean repeatedMultiplicationAllowed;
    private final boolean repeatedDivisionAllowed;
    private final boolean usesOrderOfOperations;
    private final boolean usesParentheses;
}
