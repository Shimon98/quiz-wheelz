package com.quiz_wheelz.dto.teacher;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.quiz_wheelz.dto.subject.SubjectResponse;
import com.quiz_wheelz.enums.TeacherRaceResultAwardType;
import org.junit.jupiter.api.Test;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;

class TeacherRaceResultsResponseSerializationTest {

    private final ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();

    @Test
    void resultExposesOnlyTheApprovedTopLevelAndNestedFields()
            throws JsonProcessingException {
        TeacherRaceResultsResponse response = new TeacherRaceResultsResponse(
                12L,
                "Multiplication Race",
                "ABC123",
                new SubjectResponse(3L, "Mathematics", "MATH"),
                "FINISHED",
                8,
                1,
                1000,
                1_789_910_000_000L,
                1_789_910_420_000L,
                List.of(91L),
                new TeacherRaceResultsSummaryResponse(1, 0, 14, 2),
                List.of(new TeacherRaceResultAwardResponse(
                        TeacherRaceResultAwardType.HIGHEST_SCORE,
                        List.of(91L),
                        850
                )),
                List.of(new TeacherRaceResultPlayerResponse(
                        91L,
                        "Noa",
                        3,
                        "HOVER_KART",
                        "GREEN",
                        "HOVER_KART_GREEN",
                        1,
                        850,
                        14,
                        2,
                        7,
                        1000.0,
                        "FINISHED",
                        1_789_910_228_123L
                ))
        );

        JsonNode json = serialize(response);

        assertEquals(
                Set.of(
                        "raceId",
                        "title",
                        "roomCode",
                        "subject",
                        "status",
                        "maxPlayers",
                        "playerCount",
                        "totalDistance",
                        "startedAtEpochMs",
                        "finishedAtEpochMs",
                        "winnerRacePlayerIds",
                        "summary",
                        "awards",
                        "players"
                ),
                fieldNames(json)
        );
        assertEquals(Set.of("id", "name", "code"), fieldNames(json.get("subject")));
        assertEquals(
                Set.of(
                        "finishedPlayers",
                        "disconnectedPlayers",
                        "totalCorrectAnswers",
                        "totalWrongAnswers"
                ),
                fieldNames(json.get("summary"))
        );
        assertEquals(
                Set.of("type", "racePlayerIds", "value"),
                fieldNames(json.get("awards").get(0))
        );
        assertEquals(
                Set.of(
                        "racePlayerId",
                        "displayName",
                        "laneNumber",
                        "vehicleTypeKey",
                        "vehicleColorKey",
                        "vehicleAssetKey",
                        "rank",
                        "score",
                        "correctAnswers",
                        "wrongAnswers",
                        "bestStreak",
                        "position",
                        "status",
                        "finishedAtEpochMs"
                ),
                fieldNames(json.get("players").get(0))
        );
        assertEquals("HIGHEST_SCORE", json.get("awards").get(0).get("type").asText());
        assertFalse(json.has("eventVersion"));
        assertFalse(json.get("players").get(0).has("speed"));
    }

    private JsonNode serialize(Object value) throws JsonProcessingException {
        return objectMapper.readTree(objectMapper.writeValueAsString(value));
    }

    private Set<String> fieldNames(JsonNode node) {
        Set<String> names = new HashSet<>();
        node.fieldNames().forEachRemaining(names::add);
        return names;
    }
}
