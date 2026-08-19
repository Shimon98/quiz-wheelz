package com.quiz_wheelz.dto.raceplayer;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.quiz_wheelz.enums.Difficulty;
import com.quiz_wheelz.enums.RacePlayerStatus;
import com.quiz_wheelz.enums.RaceStatus;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.HashSet;
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
                        "HOVER_KART",
                        "GREEN",
                        "HOVER_KART_GREEN"
                ),
                new StudentRaceRuntimeSnapshotResponse(
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
                        1_787_148_000_000L,
                        4.8
                )
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
        assertEquals("HOVER_KART_GREEN", player.get("vehicleAssetKey").asText());
        assertFalse(player.has("status"));
        assertFalse(player.has("playerStatus"));

        JsonNode snapshot = json.get("snapshot");
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
                fieldNames(snapshot)
        );
        assertEquals("MEDIUM", snapshot.get("currentDifficulty").asText());
        assertEquals("RACING", snapshot.get("playerStatus").asText());
        assertEquals("IN_PROGRESS", snapshot.get("raceStatus").asText());
        assertEquals(1_787_148_000_000L, snapshot.get("snapshotAtEpochMs").asLong());
        assertEquals(4.8, snapshot.get("movementUnitsPerSecond").asDouble());
    }

    private Set<String> fieldNames(JsonNode node) {
        Set<String> names = new HashSet<>();
        node.fieldNames().forEachRemaining(names::add);
        return names;
    }
}
