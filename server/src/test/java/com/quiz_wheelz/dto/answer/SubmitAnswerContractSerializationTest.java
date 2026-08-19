package com.quiz_wheelz.dto.answer;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.quiz_wheelz.dto.raceplayer.StudentRaceRuntimeSnapshotResponse;
import com.quiz_wheelz.enums.Difficulty;
import com.quiz_wheelz.enums.PlayerQuestionStatus;
import com.quiz_wheelz.enums.RacePlayerStatus;
import com.quiz_wheelz.enums.RaceStatus;
import org.junit.jupiter.api.Test;

import java.util.HashSet;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

class SubmitAnswerContractSerializationTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void shouldSerializeExactSubmitAnswerRequestFields() throws JsonProcessingException {
        SubmitAnswerRequest request = new SubmitAnswerRequest();
        request.setQuestionId(501L);
        request.setChoiceId(1001L);

        JsonNode json = objectMapper.readTree(objectMapper.writeValueAsString(request));

        assertEquals(Set.of("questionId", "choiceId"), fieldNames(json));
        assertEquals(501L, json.get("questionId").asLong());
        assertEquals(1001L, json.get("choiceId").asLong());
    }

    @Test
    void shouldSerializeCorrectAnswerWithoutRevealingCorrectChoiceId()
            throws JsonProcessingException {
        JsonNode json = serializeResponse(true, null);

        assertFrozenResponseFields(json);
        assertTrue(json.get("correct").asBoolean());
        assertTrue(json.get("correctAnswerChoiceId").isNull());
    }

    @Test
    void shouldSerializeWrongAnswerWithPostSubmissionCorrectChoiceReveal()
            throws JsonProcessingException {
        JsonNode json = serializeResponse(false, 1002L);

        assertFrozenResponseFields(json);
        assertFalse(json.get("correct").asBoolean());
        assertEquals(1002L, json.get("correctAnswerChoiceId").asLong());
    }

    private JsonNode serializeResponse(boolean correct, Long correctAnswerChoiceId)
            throws JsonProcessingException {
        SubmitAnswerResponse response = new SubmitAnswerResponse(
                501L,
                1001L,
                correct,
                correctAnswerChoiceId,
                PlayerQuestionStatus.ANSWERED.name(),
                1_787_148_010_000L,
                1_787_148_030_000L,
                new StudentAnswerRaceImpactResponse(
                        correct ? 10 : 0,
                        correct ? 10.0 : 0.0,
                        false,
                        createSnapshot()
                )
        );

        return objectMapper.readTree(objectMapper.writeValueAsString(response));
    }

    private void assertFrozenResponseFields(JsonNode json) {
        assertEquals(
                Set.of(
                        "questionId",
                        "selectedChoiceId",
                        "correct",
                        "correctAnswerChoiceId",
                        "questionStatus",
                        "answeredAtEpochMs",
                        "expiresAtEpochMs",
                        "raceImpact"
                ),
                fieldNames(json)
        );
        assertEquals("ANSWERED", json.get("questionStatus").asText());
        assertTrue(json.get("answeredAtEpochMs").isIntegralNumber());
        assertTrue(json.get("expiresAtEpochMs").isIntegralNumber());

        JsonNode raceImpact = json.get("raceImpact");
        assertEquals(
                Set.of("scoreDelta", "progressDelta", "difficultyChanged", "snapshot"),
                fieldNames(raceImpact)
        );
        assertEquals(
                Set.of(
                        "totalDistance",
                        "score",
                        "position",
                        "speed",
                        "streak",
                        "highestStreak",
                        "currentDifficulty",
                        "playerStatus",
                        "raceStatus",
                        "playerFinished",
                        "raceFinished",
                        "snapshotAtEpochMs",
                        "movementUnitsPerSecond"
                ),
                fieldNames(raceImpact.get("snapshot"))
        );
    }

    private StudentRaceRuntimeSnapshotResponse createSnapshot() {
        return new StudentRaceRuntimeSnapshotResponse(
                1000,
                420,
                350.0,
                1.2,
                3,
                5,
                Difficulty.MEDIUM,
                RacePlayerStatus.RACING,
                RaceStatus.IN_PROGRESS,
                false,
                false,
                1_787_148_010_000L,
                4.8
        );
    }

    private Set<String> fieldNames(JsonNode node) {
        Set<String> names = new HashSet<>();
        node.fieldNames().forEachRemaining(names::add);
        return names;
    }
}
