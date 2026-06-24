package com.quiz_wheelz.service.question;

import com.quiz_wheelz.common.MathQuestionTextRules;
import com.quiz_wheelz.common.QuestionRules;
import com.quiz_wheelz.dto.question.MathQuestionData;
import com.quiz_wheelz.dto.question.QuestionPlan;
import com.quiz_wheelz.enums.QuestionType;
import com.quiz_wheelz.exception.ApiException;
import com.quiz_wheelz.exception.ErrorCode;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Random;

@Service
public class MathQuestionGenerator {

    private final Random random;

    public MathQuestionGenerator() {
        this(new Random());
    }

    MathQuestionGenerator(Random random) {
        this.random = random;
    }

    public MathQuestionData generate(QuestionPlan questionPlan) {
        validateQuestionPlan(questionPlan);

        return switch (questionPlan.getQuestionType()) {
            case ADDITION -> generateAddition(questionPlan);
            case SUBTRACTION -> generateSubtraction(questionPlan);
            case MULTIPLICATION -> generateMultiplication(questionPlan);
            case DIVISION -> generateDivision(questionPlan);
            case ORDER_OF_OPERATIONS -> generateOrderOfOperations(questionPlan);
            case PARENTHESES -> generateParentheses(questionPlan);
            default -> throw new ApiException(ErrorCode.QUESTION_TYPE_NOT_SUPPORTED);
        };
    }

    private MathQuestionData generateAddition(QuestionPlan questionPlan) {
        int leftOperand = randomValue(questionPlan.getMinValue(), questionPlan.getMaxValue());
        int rightOperand = randomValue(questionPlan.getMinValue(), questionPlan.getMaxValue());
        int correctAnswer = leftOperand + rightOperand;

        return new MathQuestionData(
                MathQuestionTextRules.buildBinaryQuestionText(
                        leftOperand,
                        MathQuestionTextRules.ADDITION_OPERATOR,
                        rightOperand
                ),
                correctAnswer,
                leftOperand,
                rightOperand,
                QuestionType.ADDITION
        );
    }

    private MathQuestionData generateSubtraction(QuestionPlan questionPlan) {
        int firstValue = randomValue(questionPlan.getMinValue(), questionPlan.getMaxValue());
        int secondValue = randomValue(questionPlan.getMinValue(), questionPlan.getMaxValue());

        int leftOperand = Math.max(firstValue, secondValue);
        int rightOperand = Math.min(firstValue, secondValue);
        int correctAnswer = leftOperand - rightOperand;

        return new MathQuestionData(
                MathQuestionTextRules.buildBinaryQuestionText(
                        leftOperand,
                        MathQuestionTextRules.SUBTRACTION_OPERATOR,
                        rightOperand
                ),
                correctAnswer,
                leftOperand,
                rightOperand,
                QuestionType.SUBTRACTION
        );
    }

    private MathQuestionData generateMultiplication(QuestionPlan questionPlan) {
        int leftOperand = randomValue(questionPlan.getMinValue(), questionPlan.getMaxValue());
        int rightOperand = randomValue(questionPlan.getMinValue(), questionPlan.getMaxValue());
        int correctAnswer = leftOperand * rightOperand;

        return new MathQuestionData(
                MathQuestionTextRules.buildBinaryQuestionText(
                        leftOperand,
                        MathQuestionTextRules.MULTIPLICATION_OPERATOR,
                        rightOperand
                ),
                correctAnswer,
                leftOperand,
                rightOperand,
                QuestionType.MULTIPLICATION
        );
    }

    private MathQuestionData generateDivision(QuestionPlan questionPlan) {
        validateDivisionRange(questionPlan);

        int divisor = randomValue(
                Math.max(QuestionRules.MIN_DIVISION_FACTOR_VALUE, questionPlan.getMinValue()),
                questionPlan.getMaxValue()
        );

        int quotient = randomValue(
                Math.max(QuestionRules.MIN_DIVISION_FACTOR_VALUE, questionPlan.getMinValue()),
                questionPlan.getMaxValue()
        );

        int dividend = divisor * quotient;

        return new MathQuestionData(
                MathQuestionTextRules.buildBinaryQuestionText(
                        dividend,
                        MathQuestionTextRules.DIVISION_OPERATOR,
                        divisor
                ),
                quotient,
                dividend,
                divisor,
                QuestionType.DIVISION
        );
    }

    private MathQuestionData generateOrderOfOperations(QuestionPlan questionPlan) {
        validateComplexExpressionRange(questionPlan);

        int firstOperand = randomValue(questionPlan.getMinValue(), questionPlan.getMaxValue());
        int secondOperand = randomValue(questionPlan.getMinValue(), questionPlan.getMaxValue());
        int thirdOperand = randomValue(
                Math.max(QuestionRules.MIN_COMPLEX_EXPRESSION_MULTIPLIER_VALUE, questionPlan.getMinValue()),
                questionPlan.getMaxValue()
        );

        int correctAnswer = firstOperand + secondOperand * thirdOperand;
        int leftToRightMistake = (firstOperand + secondOperand) * thirdOperand;

        return new MathQuestionData(
                MathQuestionTextRules.buildOrderOfOperationsQuestionText(
                        firstOperand,
                        MathQuestionTextRules.ADDITION_OPERATOR,
                        secondOperand,
                        MathQuestionTextRules.MULTIPLICATION_OPERATOR,
                        thirdOperand
                ),
                correctAnswer,
                firstOperand,
                secondOperand,
                QuestionType.ORDER_OF_OPERATIONS,
                List.of(firstOperand, secondOperand, thirdOperand),
                preferredDistractors(correctAnswer, leftToRightMistake)
        );
    }

    private MathQuestionData generateParentheses(QuestionPlan questionPlan) {
        validateComplexExpressionRange(questionPlan);

        int firstOperand = randomValue(questionPlan.getMinValue(), questionPlan.getMaxValue());
        int secondOperand = randomValue(questionPlan.getMinValue(), questionPlan.getMaxValue());
        int thirdOperand = randomValue(
                Math.max(QuestionRules.MIN_COMPLEX_EXPRESSION_MULTIPLIER_VALUE, questionPlan.getMinValue()),
                questionPlan.getMaxValue()
        );

        int correctAnswer = (firstOperand + secondOperand) * thirdOperand;
        int ignoreParenthesesMistake = firstOperand + secondOperand * thirdOperand;

        return new MathQuestionData(
                MathQuestionTextRules.buildParenthesesQuestionText(
                        firstOperand,
                        MathQuestionTextRules.ADDITION_OPERATOR,
                        secondOperand,
                        MathQuestionTextRules.MULTIPLICATION_OPERATOR,
                        thirdOperand
                ),
                correctAnswer,
                firstOperand,
                secondOperand,
                QuestionType.PARENTHESES,
                List.of(firstOperand, secondOperand, thirdOperand),
                preferredDistractors(correctAnswer, ignoreParenthesesMistake)
        );
    }

    private List<Integer> preferredDistractors(
            Integer correctAnswer,
            Integer... candidates
    ) {
        List<Integer> distractors = new ArrayList<>();

        for (Integer candidate : candidates) {
            if (candidate != null
                    && candidate >= QuestionRules.MIN_DISTRACTOR_VALUE
                    && !candidate.equals(correctAnswer)
                    && !distractors.contains(candidate)) {
                distractors.add(candidate);
            }
        }

        return distractors;
    }

    private int randomValue(Integer minValue, Integer maxValue) {
        return random.nextInt(maxValue - minValue + 1) + minValue;
    }

    private void validateQuestionPlan(QuestionPlan questionPlan) {
        if (questionPlan == null
                || questionPlan.getQuestionType() == null
                || questionPlan.getMinValue() == null
                || questionPlan.getMaxValue() == null) {
            throw new ApiException(ErrorCode.INVALID_QUESTION_TEMPLATE_CONFIG);
        }

        if (!QuestionRules.isSupportedMathQuestionType(questionPlan.getQuestionType())) {
            throw new ApiException(ErrorCode.QUESTION_TYPE_NOT_SUPPORTED);
        }

        if (questionPlan.getMinValue() > questionPlan.getMaxValue()) {
            throw new ApiException(ErrorCode.INVALID_QUESTION_TEMPLATE_CONFIG);
        }

        if (questionPlan.getMinValue() < QuestionRules.MIN_DISTRACTOR_VALUE) {
            throw new ApiException(ErrorCode.INVALID_QUESTION_TEMPLATE_CONFIG);
        }
    }

    private void validateDivisionRange(QuestionPlan questionPlan) {
        if (questionPlan.getMaxValue() < QuestionRules.MIN_DIVISION_FACTOR_VALUE) {
            throw new ApiException(ErrorCode.INVALID_QUESTION_TEMPLATE_CONFIG);
        }
    }

    private void validateComplexExpressionRange(QuestionPlan questionPlan) {
        if (questionPlan.getMaxValue() < QuestionRules.MIN_COMPLEX_EXPRESSION_MULTIPLIER_VALUE) {
            throw new ApiException(ErrorCode.INVALID_QUESTION_TEMPLATE_CONFIG);
        }
    }
}
