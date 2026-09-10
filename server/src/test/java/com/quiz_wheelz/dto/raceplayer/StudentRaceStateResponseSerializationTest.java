package com.quiz_wheelz.dto.raceplayer;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class StudentRaceStateResponseSerializationTest {

    private final ObjectMapper objectMapper = new ObjectMapper()
            .findAndRegisterModules()
            .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

    @Test
    void shouldSerializeExactFrozenRaceStateContract() throws JsonProcessingException {
        StudentRaceStateResponse response = new StudentRaceStateResponse(
                12L,
                "Multiplication Race",
                "ABC123",
                LocalDateTime.of(2026, 8, 19, 16, 0),
                null,
                new StudentRacePlayerPresentationResponse(
                        91L,
                        "Noa",
                        3,
                        "TOY_CAR",
                        "GREEN",
                        "TOY_CAR_GREEN"
                ),
                StudentRaceSnapshotContractFixture.snapshot()
        );

        JsonNode json = objectMapper.readTree(objectMapper.writeValueAsString(response));

        assertEquals(
                Set.of(
                        "raceId",
                        "raceTitle",
                        "roomCode",
                        "startedAt",
                        "finishedAt",
                        "player",
                        "snapshot"
                ),
                fieldNames(json)
        );
        assertEquals("2026-08-19T16:00:00", json.get("startedAt").asText());
        assertTrue(json.get("finishedAt").isNull());

        JsonNode player = json.get("player");
        assertEquals(
                Set.of(
                        "racePlayerId",
                        "displayName",
                        "laneNumber",
                        "vehicleTypeKey",
                        "vehicleColorKey",
                        "vehicleAssetKey"
                ),
                fieldNames(player)
        );
        assertEquals("TOY_CAR_GREEN", player.get("vehicleAssetKey").asText());
        assertFalse(player.has("status"));

        JsonNode snapshot = json.get("snapshot");
        assertEquals(StudentRaceSnapshotContractFixture.SNAPSHOT_FIELDS, fieldNames(snapshot));
        assertEquals("MEDIUM", snapshot.get("currentDifficulty").asText());
        assertEquals("RACING", snapshot.get("playerStatus").asText());
        assertEquals("IN_PROGRESS", snapshot.get("raceStatus").asText());
        assertEquals(1_787_148_000_000L, snapshot.get("snapshotAtEpochMs").asLong());
        assertEquals(1_787_147_999_800L, snapshot.get("positionAtEpochMs").asLong());
        assertTrue(snapshot.get("playerFinishedAtEpochMs").isNull());
        assertEquals(4.8, snapshot.get("movementUnitsPerSecond").asDouble());
        assertEquals(153L, snapshot.get("eventVersion").asLong());
        assertEquals(2, snapshot.get("rank").asInt());
        assertEquals(5, snapshot.get("playerCount").asInt());
        assertFalse(snapshot.has("nearbyPlayers"));

        JsonNode opponent = snapshot.get("opponents").get(0);
        assertEquals(StudentRaceSnapshotContractFixture.OPPONENT_FIELDS, fieldNames(opponent));
        assertEquals("DISCONNECTED", opponent.get("status").asText());
        assertEquals("TOY_CAR_BLUE", opponent.get("vehicleAssetKey").asText());
        assertEquals(1, opponent.get("rank").asInt());
        assertEquals(1_787_147_999_100L, opponent.get("positionAtEpochMs").asLong());
        assertEquals(0.0, opponent.get("movementUnitsPerSecond").asDouble());
        assertTrue(opponent.get("finishedAtEpochMs").isNull());
        assertFalse(opponent.has("speed"));
        assertFalse(opponent.has("score"));
        assertFalse(opponent.has("streak"));
        assertFalse(opponent.has("currentDifficulty"));
        assertFalse(opponent.has("correctAnswers"));
        assertFalse(opponent.has("wrongAnswers"));
        assertFalse(opponent.has("lastSeenAt"));
        assertFalse(opponent.has("movementUpdatedAtEpochMs"));
        assertFalse(opponent.has("focusLossCount"));
        assertFalse(opponent.has("finishedAt"));
    }

    private Set<String> fieldNames(JsonNode node) {
        return StudentRaceSnapshotContractFixture.fieldNames(node);
    }
}
