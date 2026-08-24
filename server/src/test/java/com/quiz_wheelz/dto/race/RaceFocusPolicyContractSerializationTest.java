package com.quiz_wheelz.dto.race;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.quiz_wheelz.dto.teacher.TeacherRaceRoomResponse;
import com.quiz_wheelz.entitys.Race;
import com.quiz_wheelz.entitys.Subject;
import com.quiz_wheelz.enums.RaceFocusPolicy;
import com.quiz_wheelz.enums.RaceStatus;
import org.junit.jupiter.api.Test;

import java.util.HashSet;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;

class RaceFocusPolicyContractSerializationTest {

    private final ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();

    @Test
    void createRequestExposesOnlyExistingFieldsAndOptionalFocusPolicy()
            throws JsonProcessingException {
        CreateRaceRequest request = new CreateRaceRequest();
        request.setTitle("Math Race");
        request.setSubjectId(1L);
        request.setMaxPlayers(8);
        request.setTotalDistance(1000);
        request.setFocusPolicy(RaceFocusPolicy.STRICT);

        JsonNode json = serialize(request);

        assertEquals(
                Set.of("title", "subjectId", "maxPlayers", "totalDistance", "focusPolicy"),
                fieldNames(json)
        );
        assertEquals("STRICT", json.get("focusPolicy").asText());
    }

    @Test
    void raceSummaryExposesConfiguredFocusPolicy() throws JsonProcessingException {
        JsonNode json = serialize(RaceSummaryResponse.from(race()));

        assertEquals(
                Set.of(
                        "raceId",
                        "title",
                        "roomCode",
                        "subjectId",
                        "subjectName",
                        "subjectCode",
                        "status",
                        "maxPlayers",
                        "currentPlayers",
                        "totalDistance",
                        "focusPolicy",
                        "createdAt"
                ),
                fieldNames(json)
        );
        assertEquals("STRICT", json.get("focusPolicy").asText());
    }

    @Test
    void teacherRoomExposesConfiguredFocusPolicy() throws JsonProcessingException {
        JsonNode json = serialize(TeacherRaceRoomResponse.from(race()));

        assertEquals(
                Set.of(
                        "raceId",
                        "title",
                        "roomCode",
                        "subjectId",
                        "subjectName",
                        "subjectCode",
                        "status",
                        "maxPlayers",
                        "currentPlayers",
                        "totalDistance",
                        "focusPolicy",
                        "createdAt",
                        "startedAt",
                        "finishedAt",
                        "players"
                ),
                fieldNames(json)
        );
        assertEquals("STRICT", json.get("focusPolicy").asText());
    }

    private Race race() {
        Subject subject = new Subject();
        subject.setId(1L);
        subject.setName("Math");
        subject.setCode("MATH");

        Race race = new Race();
        race.setId(9L);
        race.setTitle("Math Race");
        race.setRoomCode("ABC123");
        race.setSubject(subject);
        race.setStatus(RaceStatus.WAITING_FOR_PLAYERS);
        race.setMaxPlayers(8);
        race.setTotalDistance(1000);
        race.setFocusPolicy(RaceFocusPolicy.STRICT);
        return race;
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
