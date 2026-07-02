package com.quiz_wheelz.common.mathpattern;

import com.quiz_wheelz.enums.Difficulty;
import com.quiz_wheelz.enums.MathOperator;
import com.quiz_wheelz.enums.QuestionGenerationPattern;
import com.quiz_wheelz.enums.QuestionType;
import lombok.Builder;
import lombok.Value;

import java.util.Map;
import java.util.Set;

@Value
@Builder
public class MathPatternDefinition {

    QuestionGenerationPattern generationPattern;
    Set<Difficulty> allowedDifficulties;
    Set<QuestionType> allowedQuestionTypes;
    Set<MathOperator> usedOperators;
    Map<QuestionType, Integer> maxMultiplicationOperatorCounts;
    Map<QuestionType, Integer> maxDivisionOperatorCounts;
    int maxMultiplicationFactor;
    int maxDivisionFactor;
    Map<Difficulty, Integer> maxCorrectAnswerValuesByDifficulty;
    boolean repeatedMultiplicationAllowed;
    boolean repeatedDivisionAllowed;
    boolean usesOrderOfOperations;
    boolean usesParentheses;
}
