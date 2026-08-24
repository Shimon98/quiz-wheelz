package com.quiz_wheelz.dto.raceplayer;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.quiz_wheelz.enums.RacePlayerFocusEventOutcome;
import com.quiz_wheelz.enums.RacePlayerFocusEventType;
import org.junit.jupiter.api.Test;

import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;

class RacePlayerFocusEventContractSerializationTest {

    private static final UUID EVENT_ID =
            UUID.fromString("550e8400-e29b-41d4-a716-446655440000");

    private final ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();

    @Test
    void requestSerializesOnlyEventIdAndType() throws JsonProcessingException {
        RacePlayerFocusEventRequest request = new RacePlayerFocusEventRequest();
        request.setEventId(EVENT_ID);
        request.setType(RacePlayerFocusEventType.TAB_HIDDEN);

        JsonNode json = serialize(request);

        assertEquals(Set.of("eventId", "type"), fieldNames(json));
        assertEquals(EVENT_ID.toString(), json.get("eventId").asText());
        assertEquals("TAB_HIDDEN", json.get("type").asText());
        assertFalse(json.has("questionId"));
        assertFalse(json.has("raceId"));
        assertFalse(json.has("racePlayerId"));
    }

    @Test
    void responseSerializesOnlyFrozenSafeFields() throws JsonProcessingException {
        RacePlayerFocusEventResponse response = new RacePlayerFocusEventResponse(
                EVENT_ID,
                RacePlayerFocusEventType.TAB_HIDDEN,
                RacePlayerFocusEventOutcome.FORFEITED,
                3,
                1,
                42L,
                1787500000000L
        );

        JsonNode json = serialize(response);

        assertEquals(
                Set.of(
                        "eventId",
                        "type",
                        "outcome",
                        "focusLossCount",
                        "questionFocusLossCount",
                        "activeQuestionId",
                        "recordedAtEpochMs"
                ),
                fieldNames(json)
        );
        assertEquals("FORFEITED", json.get("outcome").asText());
        assertFalse(json.has("racePlayer"));
        assertFalse(json.has("playerQuestion"));
        assertFalse(json.has("correctAnswerValue"));
        assertFalse(json.has("recordedAt"));
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
