package com.quiz_wheelz.service.question.generator;

import java.util.List;

record ExpressionQuestionGenerationResult(
        List<Integer> operands,
        Integer correctAnswer
) {
}
