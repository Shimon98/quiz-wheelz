package com.quiz_wheelz.enums;

import com.quiz_wheelz.common.QuestionRules;

import java.util.List;

public enum MathExpressionPattern {

    BINARY_OPERATION(
            null,
            List.of(),
            List.of(),
            MathQuestionTextLayout.STANDARD
    ),

    MULTIPLICATION_CHAIN(
            QuestionType.MULTIPLICATION,
            List.of(MathOperator.MULTIPLICATION, MathOperator.MULTIPLICATION),
            List.of(MathOperandRole.ANY, MathOperandRole.ANY, MathOperandRole.ANY),
            MathQuestionTextLayout.STANDARD
    ) {
        @Override
        public int calculateCorrectAnswer(List<Integer> operands) {
            return first(operands) * second(operands) * third(operands);
        }
    },

    ADD_THEN_MULTIPLY(
            QuestionType.ORDER_OF_OPERATIONS,
            List.of(MathOperator.ADDITION, MathOperator.MULTIPLICATION),
            List.of(
                    MathOperandRole.ADDEND,
                    MathOperandRole.MULTIPLIER,
                    MathOperandRole.MULTIPLIER
            ),
            MathQuestionTextLayout.STANDARD
    ) {
        @Override
        public int calculateCorrectAnswer(List<Integer> operands) {
            return first(operands) + second(operands) * third(operands);
        }

        @Override
        public List<Integer> calculatePreferredDistractorCandidates(List<Integer> operands) {
            return List.of((first(operands) + second(operands)) * third(operands));
        }
    },

    ADD_MULTIPLY_SUBTRACT(
            QuestionType.ORDER_OF_OPERATIONS,
            List.of(MathOperator.ADDITION, MathOperator.MULTIPLICATION, MathOperator.SUBTRACTION),
            List.of(
                    MathOperandRole.ADDEND,
                    MathOperandRole.ANY,
                    MathOperandRole.MULTIPLIER,
                    MathOperandRole.ANY
            ),
            MathQuestionTextLayout.STANDARD
    ) {
        @Override
        public int calculateCorrectAnswer(List<Integer> operands) {
            return first(operands)
                    + second(operands) * third(operands)
                    - fourth(operands);
        }

        @Override
        public List<Integer> calculatePreferredDistractorCandidates(List<Integer> operands) {
            return List.of(
                    (first(operands) + second(operands))
                            * third(operands)
                            - fourth(operands)
            );
        }
    },

    PARENTHESES_SUM_THEN_MULTIPLY(
            QuestionType.PARENTHESES,
            List.of(MathOperator.ADDITION, MathOperator.MULTIPLICATION),
            List.of(MathOperandRole.ADDEND, MathOperandRole.ANY, MathOperandRole.MULTIPLIER),
            MathQuestionTextLayout.PARENTHESES_FIRST_TWO
    ) {
        @Override
        public int calculateCorrectAnswer(List<Integer> operands) {
            return (first(operands) + second(operands)) * third(operands);
        }

        @Override
        public List<Integer> calculatePreferredDistractorCandidates(List<Integer> operands) {
            return List.of(first(operands) + second(operands) * third(operands));
        }
    },

    MULTIPLY_BY_PARENTHESES_SUM(
            QuestionType.PARENTHESES,
            List.of(MathOperator.MULTIPLICATION, MathOperator.ADDITION),
            List.of(MathOperandRole.MULTIPLIER, MathOperandRole.ANY, MathOperandRole.ADDEND),
            MathQuestionTextLayout.PARENTHESES_LAST_TWO
    ) {
        @Override
        public int calculateCorrectAnswer(List<Integer> operands) {
            return first(operands) * (second(operands) + third(operands));
        }

        @Override
        public List<Integer> calculatePreferredDistractorCandidates(List<Integer> operands) {
            return List.of(first(operands) * second(operands) + third(operands));
        }
    };

    private final QuestionType questionType;
    private final List<MathOperator> operators;
    private final List<MathOperandRole> operandRoles;
    private final MathQuestionTextLayout textLayout;

    MathExpressionPattern(
            QuestionType questionType,
            List<MathOperator> operators,
            List<MathOperandRole> operandRoles,
            MathQuestionTextLayout textLayout
    ) {
        this.questionType = questionType;
        this.operators = operators;
        this.operandRoles = operandRoles;
        this.textLayout = textLayout;
    }

    public QuestionType getQuestionType() {
        return questionType;
    }

    public List<MathOperator> getOperators() {
        return operators;
    }

    public List<MathOperandRole> getOperandRoles() {
        return operandRoles;
    }

    public MathQuestionTextLayout getTextLayout() {
        return textLayout;
    }

    public int calculateCorrectAnswer(List<Integer> operands) {
        throw new UnsupportedOperationException(
                "Pattern does not support expression answer calculation: " + this
        );
    }

    public List<Integer> calculatePreferredDistractorCandidates(List<Integer> operands) {
        return List.of();
    }

    private static int first(List<Integer> operands) {
        return operands.get(QuestionRules.FIRST_OPERAND_INDEX);
    }

    private static int second(List<Integer> operands) {
        return operands.get(QuestionRules.SECOND_OPERAND_INDEX);
    }

    private static int third(List<Integer> operands) {
        return operands.get(QuestionRules.THIRD_OPERAND_INDEX);
    }

    private static int fourth(List<Integer> operands) {
        return operands.get(QuestionRules.FOURTH_OPERAND_INDEX);
    }
}
