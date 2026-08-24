package com.quiz_wheelz.dto.teacher;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.quiz_wheelz.entitys.RacePlayer;
import com.quiz_wheelz.enums.RaceFocusPolicy;
import com.quiz_wheelz.enums.RacePlayerStatus;
import org.junit.jupiter.api.Test;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;

class TeacherRaceLiveStateResponseSerializationTest {

    private final ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();

    @Test
    void liveStateExposesOnlyTheApprovedTopLevelAndPlayerFields()
            throws JsonProcessingException {
        TeacherRaceLiveStateResponse response = new TeacherRaceLiveStateResponse(
                7L,
                "Math Race",
                "ABC123",
                "IN_PROGRESS",
                1000,
                RaceFocusPolicy.STRICT,
                1_787_568_000_000L,
                4L,
                List.of(TeacherRaceLivePlayerResponse.from(player(), 2))
        );

        JsonNode json = serialize(response);
        JsonNode player = json.get("players").get(0);

        assertEquals(
                Set.of(
                        "raceId",
                        "title",
                        "roomCode",
                        "status",
                        "totalDistance",
                        "focusPolicy",
                        "serverTimeEpochMs",
                        "eventVersion",
                        "players"
                ),
                fieldNames(json)
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
                        "position",
                        "speed",
                        "score",
                        "streak",
                        "status"
                ),
                fieldNames(player)
        );
        assertEquals("HOVER_KART_GREEN", player.get("vehicleAssetKey").asText());
        assertEquals(2, player.get("rank").asInt());
    }

    private RacePlayer player() {
        RacePlayer racePlayer = new RacePlayer();
        racePlayer.setId(11L);
        racePlayer.setDisplayName("Noa");
        racePlayer.setLaneNumber(3);
        racePlayer.setVehicleTypeKey("HOVER_KART");
        racePlayer.setVehicleColorKey("GREEN");
        racePlayer.setPosition(420.0);
        racePlayer.setSpeed(1.3);
        racePlayer.setScore(75);
        racePlayer.setStreak(4);
        racePlayer.setStatus(RacePlayerStatus.RACING);
        return racePlayer;
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
