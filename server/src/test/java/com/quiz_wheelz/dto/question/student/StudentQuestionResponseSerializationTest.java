package com.quiz_wheelz.dto.question.student;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;

class StudentQuestionResponseSerializationTest {

    private static final Set<String> FORBIDDEN_FIELDS = Set.of(
            "correct",
            "isCorrect",
            "correctAnswer",
            "correctAnswerValue",
            "answerValue",
            "questionTemplate",
            "subject",
            "racePlayer",
            "playerQuestion"
    );

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void shouldSerializeOnlySafeFrozenQuestionFields() throws JsonProcessingException {
        StudentQuestionResponse response = new StudentQuestionResponse(
                501L,
                "6 x 7 = ?",
                30,
                1_787_148_000_000L,
                1_787_148_030_000L,
                List.of(
                        new StudentQuestionChoiceResponse(1001L, "42", 1),
                        new StudentQuestionChoiceResponse(1002L, "36", 2),
                        new StudentQuestionChoiceResponse(1003L, "48", 3),
                        new StudentQuestionChoiceResponse(1004L, "40", 4)
                )
        );

        JsonNode json = objectMapper.readTree(objectMapper.writeValueAsString(response));

        assertEquals(
                Set.of(
                        "questionId",
                        "questionText",
                        "timeLimitSeconds",
                        "serverTimeEpochMs",
                        "expiresAtEpochMs",
                        "choices"
                ),
                fieldNames(json)
        );
        assertEquals(4, json.get("choices").size());
        json.get("choices").forEach(choice -> assertEquals(
                Set.of("choiceId", "choiceText", "displayOrder"),
                fieldNames(choice)
        ));

        FORBIDDEN_FIELDS.forEach(field ->
                assertFalse(containsField(json, field), "Unexpected field: " + field)
        );
    }

    private boolean containsField(JsonNode node, String fieldName) {
        if (node.isObject()) {
            if (node.has(fieldName)) {
                return true;
            }

            return node.properties().stream()
                    .anyMatch(entry -> containsField(entry.getValue(), fieldName));
        }

        if (node.isArray()) {
            for (JsonNode child : node) {
                if (containsField(child, fieldName)) {
                    return true;
                }
            }
        }

        return false;
    }

    private Set<String> fieldNames(JsonNode node) {
        Set<String> names = new HashSet<>();
        node.fieldNames().forEachRemaining(names::add);
        return names;
    }
}
