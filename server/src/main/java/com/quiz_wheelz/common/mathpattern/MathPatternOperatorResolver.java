package com.quiz_wheelz.common.mathpattern;

import com.quiz_wheelz.enums.MathOperator;
import com.quiz_wheelz.enums.QuestionGenerationPattern;
import com.quiz_wheelz.enums.QuestionType;

import java.util.Set;

public final class MathPatternOperatorResolver {

    private MathPatternOperatorResolver() {
    }

    public static Set<MathOperator> operatorsUsedByTemplate(
            QuestionType questionType,
            QuestionGenerationPattern generationPattern
    ) {
        if (questionType == null || generationPattern == null) {
            return Set.of();
        }

        if (generationPattern == QuestionGenerationPattern.BINARY_OPERATION) {
            return operatorsForBinaryQuestionType(questionType);
        }

        MathPatternDefinition definition = MathPatternCatalog.find(generationPattern);

        if (definition == null) {
            return Set.of();
        }

        return definition.getUsedOperators();
    }

    private static Set<MathOperator> operatorsForBinaryQuestionType(
            QuestionType questionType
    ) {
        return switch (questionType) {
            case ADDITION -> Set.of(MathOperator.ADDITION);
            case SUBTRACTION -> Set.of(MathOperator.SUBTRACTION);
            case MULTIPLICATION -> Set.of(MathOperator.MULTIPLICATION);
            case DIVISION -> Set.of(MathOperator.DIVISION);
            default -> Set.of();
        };
    }
}
