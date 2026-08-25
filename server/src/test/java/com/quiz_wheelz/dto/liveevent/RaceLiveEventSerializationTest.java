package com.quiz_wheelz.dto.liveevent;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.quiz_wheelz.dto.teacher.TeacherRaceLivePlayerResponse;
import com.quiz_wheelz.enums.RaceLiveEventType;
import com.quiz_wheelz.enums.RaceStatus;
import org.junit.jupiter.api.Test;

import java.util.Iterator;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.StreamSupport;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;

class RaceLiveEventSerializationTest {

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final TeacherRaceLivePlayerResponse player = new TeacherRaceLivePlayerResponse(
            7L,
            "Noa",
            2,
            "TOY_CAR",
            "RED",
            "TOY_CAR_RED",
            1,
            45.5,
            4.0,
            120,
            3,
            "RACING"
    );

    @Test
    void envelopeAndPlayerJoinedContractAreExact() throws Exception {
        RaceLiveEventEnvelope<PlayerJoinedLiveEventPayload> envelope = envelope(
                RaceLiveEventType.PLAYER_JOINED,
                new PlayerJoinedLiveEventPayload(player)
        );

        JsonNode json = objectMapper.valueToTree(envelope);

        assertFields(json, "raceId", "version", "type", "occurredAtEpochMs", "payload");
        assertEquals(41L, json.get("raceId").longValue());
        assertEquals(9L, json.get("version").longValue());
        assertEquals("PLAYER_JOINED", json.get("type").textValue());
        assertEquals(1_777_000_123_456L, json.get("occurredAtEpochMs").longValue());
        assertFields(json.get("payload"), "player");
        assertPlayer(json.get("payload").get("player"));
    }

    @Test
    void raceStartedContractIsExact() {
        JsonNode payload = payload(new RaceStartedLiveEventPayload(
                RaceStatus.IN_PROGRESS,
                1_777_000_000_000L,
                List.of(player)
        ));

        assertFields(payload, "raceStatus", "startedAtEpochMs", "players");
        assertEquals("IN_PROGRESS", payload.get("raceStatus").textValue());
        assertEquals(1_777_000_000_000L, payload.get("startedAtEpochMs").longValue());
        assertPlayer(payload.get("players").get(0));
    }

    @Test
    void questionAnsweredContractIsExactAndLeaksNoAnswerData() throws Exception {
        JsonNode payload = payload(new QuestionAnsweredLiveEventPayload(7L, 81L, true));
        String json = objectMapper.writeValueAsString(payload);

        assertFields(payload, "racePlayerId", "questionId", "correct");
        assertEquals(7L, payload.get("racePlayerId").longValue());
        assertEquals(81L, payload.get("questionId").longValue());
        assertEquals(true, payload.get("correct").booleanValue());
        for (String forbidden : List.of(
                "choiceId",
                "selectedChoiceId",
                "correctChoiceId",
                "answer",
                "correctAnswer",
                "questionText",
                "choices"
        )) {
            assertFalse(json.contains(forbidden));
        }
    }

    @Test
    void playerProgressContractIsExact() {
        JsonNode payload = payload(new PlayerProgressUpdatedLiveEventPayload(List.of(player)));

        assertFields(payload, "players");
        assertPlayer(payload.get("players").get(0));
    }

    @Test
    void playerFinishedContractIsExact() {
        JsonNode payload = payload(new PlayerFinishedLiveEventPayload(
                player,
                1_777_000_111_000L,
                List.of(player)
        ));

        assertFields(payload, "player", "finishedAtEpochMs", "players");
        assertEquals(1_777_000_111_000L, payload.get("finishedAtEpochMs").longValue());
        assertPlayer(payload.get("player"));
        assertPlayer(payload.get("players").get(0));
    }

    @Test
    void raceFinishedContractIsExact() {
        JsonNode payload = payload(new RaceFinishedLiveEventPayload(
                RaceStatus.FINISHED,
                1_777_000_222_000L,
                List.of(player)
        ));

        assertFields(payload, "raceStatus", "finishedAtEpochMs", "players");
        assertEquals("FINISHED", payload.get("raceStatus").textValue());
        assertEquals(1_777_000_222_000L, payload.get("finishedAtEpochMs").longValue());
        assertPlayer(payload.get("players").get(0));
    }

    private <T extends RaceLiveEventPayload> RaceLiveEventEnvelope<T> envelope(
            RaceLiveEventType type,
            T payload
    ) {
        return new RaceLiveEventEnvelope<>(
                41L,
                9L,
                type,
                1_777_000_123_456L,
                payload
        );
    }

    private JsonNode payload(RaceLiveEventPayload payload) {
        return objectMapper.valueToTree(payload);
    }

    private void assertPlayer(JsonNode json) {
        assertFields(
                json,
                "racePlayerId",
                "displayName",
                "laneNumber",
                "vehicleTypeKey",
                "vehicleColorKey",
                "vehicleAssetKey",
                "rank",
                "position",
                "speed",
                "score",
                "streak",
                "status"
        );
        assertEquals(1, json.get("rank").intValue());
        assertEquals("RACING", json.get("status").textValue());
    }

    private void assertFields(JsonNode json, String... expected) {
        Iterator<String> names = json.fieldNames();
        Set<String> actual = StreamSupport.stream(
                        ((Iterable<String>) () -> names).spliterator(),
                        false
                )
                .collect(Collectors.toSet());
        assertEquals(Set.of(expected), actual);
    }
}
