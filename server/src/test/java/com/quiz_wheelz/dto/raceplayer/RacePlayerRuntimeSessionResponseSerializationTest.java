package com.quiz_wheelz.dto.raceplayer;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.quiz_wheelz.enums.RacePlayerReconnectOutcome;
import com.quiz_wheelz.enums.RacePlayerStatus;
import com.quiz_wheelz.enums.RaceStatus;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;

class RacePlayerRuntimeSessionResponseSerializationTest {

    private static final LocalDateTime DECISION_TIME =
            LocalDateTime.of(2026, 8, 19, 16, 0);

    private final ObjectMapper objectMapper = new ObjectMapper()
            .findAndRegisterModules()
            .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

    @Test
    void shouldSerializeExactHeartbeatContract() throws JsonProcessingException {
        RacePlayerHeartbeatResponse response =
                new RacePlayerHeartbeatResponse(12L, 91L, DECISION_TIME);

        JsonNode json = serialize(response);

        assertEquals(Set.of("raceId", "racePlayerId", "heartbeatAt"), fieldNames(json));
        assertEquals("2026-08-19T16:00:00", json.get("heartbeatAt").asText());
    }

    @Test
    void shouldSerializeExactLeaveContract() throws JsonProcessingException {
        RacePlayerLeaveResponse response = new RacePlayerLeaveResponse(
                91L,
                DECISION_TIME,
                RacePlayerStatus.DISCONNECTED
        );

        JsonNode json = serialize(response);

        assertEquals(Set.of("racePlayerId", "leftAt", "playerStatus"), fieldNames(json));
        assertEquals("2026-08-19T16:00:00", json.get("leftAt").asText());
        assertEquals("DISCONNECTED", json.get("playerStatus").asText());
    }

    @Test
    void shouldSerializeExactFocusedReconnectContract() throws JsonProcessingException {
        RacePlayerReconnectResponse response = new RacePlayerReconnectResponse(
                12L,
                91L,
                RacePlayerReconnectOutcome.RECONNECTED,
                true,
                true,
                RacePlayerStatus.RACING,
                RaceStatus.IN_PROGRESS,
                DECISION_TIME
        );

        JsonNode json = serialize(response);

        assertEquals(
                Set.of(
                        "raceId",
                        "racePlayerId",
                        "outcome",
                        "online",
                        "canContinueRace",
                        "playerStatus",
                        "raceStatus",
                        "resolvedAt"
                ),
                fieldNames(json)
        );
        assertEquals("RECONNECTED", json.get("outcome").asText());
        assertEquals("RACING", json.get("playerStatus").asText());
        assertEquals("IN_PROGRESS", json.get("raceStatus").asText());
        assertEquals("2026-08-19T16:00:00", json.get("resolvedAt").asText());
        assertFalse(json.has("snapshot"));
    }

    private JsonNode serialize(Object response) throws JsonProcessingException {
        return objectMapper.readTree(objectMapper.writeValueAsString(response));
    }

    private Set<String> fieldNames(JsonNode node) {
        Set<String> names = new HashSet<>();
        node.fieldNames().forEachRemaining(names::add);
        return names;
    }
}
