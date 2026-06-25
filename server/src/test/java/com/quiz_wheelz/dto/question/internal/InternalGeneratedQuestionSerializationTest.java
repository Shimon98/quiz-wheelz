package com.quiz_wheelz.dto.question.internal;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.quiz_wheelz.common.QuestionRules;
import com.quiz_wheelz.entitys.QuestionTemplate;
import com.quiz_wheelz.entitys.Subject;
import com.quiz_wheelz.enums.Difficulty;
import com.quiz_wheelz.enums.QuestionType;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class InternalGeneratedQuestionSerializationTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void shouldNotSerializeSensitiveGeneratedQuestionFields() throws JsonProcessingException {
        InternalGeneratedQuestion generatedQuestion = new InternalGeneratedQuestion(
                createMathSubject(),
                new QuestionTemplate(),
                QuestionType.ADDITION,
                Difficulty.EASY,
                "6 + 6 = ?",
                12,
                QuestionRules.DEFAULT_TIME_LIMIT_SECONDS,
                List.of(
                        new InternalGeneratedQuestionChoice("12", 12, true, 1),
                        new InternalGeneratedQuestionChoice("10", 10, false, 2)
                )
        );

        String json = objectMapper.writeValueAsString(generatedQuestion);

        assertTrue(json.contains("questionText"));
        assertTrue(json.contains("choices"));
        assertTrue(json.contains("choiceText"));
        assertTrue(json.contains("displayOrder"));

        assertFalse(json.contains("correctAnswerValue"));
        assertFalse(json.contains("answerValue"));
        assertFalse(json.contains("correct"));
        assertFalse(json.contains("questionTemplate"));
        assertFalse(json.contains("subject"));
    }

    private Subject createMathSubject() {
        Subject subject = new Subject();
        subject.setCode(QuestionRules.DEFAULT_SUBJECT_CODE);
        subject.setName("Math");
        subject.setActive(true);

        return subject;
    }
}