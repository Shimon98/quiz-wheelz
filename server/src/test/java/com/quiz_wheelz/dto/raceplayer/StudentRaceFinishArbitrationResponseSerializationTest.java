package com.quiz_wheelz.dto.raceplayer;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.quiz_wheelz.service.raceengine.RaceFinishOrderPolicy.ConfirmedFinisher;
import com.quiz_wheelz.service.raceengine.RaceFinishOrderPolicy.FinishOrderProof;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class StudentRaceFinishArbitrationResponseSerializationTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void shouldSerializeSnapshotAndConfirmedPrefix() throws JsonProcessingException {
        StudentRaceFinishArbitrationResponse response = new StudentRaceFinishArbitrationResponse(
                12L,
                StudentRaceSnapshotContractFixture.snapshot(),
                StudentRaceFinishOrderResponse.from(
                        new FinishOrderProof(
                                1_787_148_000_300L,
                                List.of(
                                        new ConfirmedFinisher(92L, 1_787_148_000_120L, 1),
                                        new ConfirmedFinisher(91L, 1_787_148_000_151L, 2)
                                )
                        ),
                        1_787_148_000_400L,
                        153L
                )
        );

        JsonNode json = objectMapper.readTree(objectMapper.writeValueAsString(response));

        assertEquals(Set.of("raceId", "snapshot", "finishOrder"),
                StudentRaceSnapshotContractFixture.fieldNames(json));
        assertEquals(
                StudentRaceSnapshotContractFixture.SNAPSHOT_FIELDS,
                StudentRaceSnapshotContractFixture.fieldNames(json.get("snapshot"))
        );
        JsonNode finishOrder = json.get("finishOrder");
        assertEquals(
                Set.of("decidedAtEpochMs", "eventVersion", "confirmedThroughEpochMs", "confirmedFinishers"),
                StudentRaceSnapshotContractFixture.fieldNames(finishOrder)
        );
        assertEquals(1_787_148_000_400L, finishOrder.get("decidedAtEpochMs").asLong());
        assertEquals(153L, finishOrder.get("eventVersion").asLong());
        assertEquals(1_787_148_000_300L, finishOrder.get("confirmedThroughEpochMs").asLong());
        JsonNode first = finishOrder.get("confirmedFinishers").get(0);
        assertEquals(Set.of("racePlayerId", "finishedAtEpochMs", "rank"),
                StudentRaceSnapshotContractFixture.fieldNames(first));
        assertEquals(92L, first.get("racePlayerId").asLong());
        assertEquals(1_787_148_000_120L, first.get("finishedAtEpochMs").asLong());
        assertEquals(1, first.get("rank").asInt());
    }

    @Test
    void unprovenOrderSerializesNullBoundAndEmptyPrefix() throws JsonProcessingException {
        StudentRaceFinishOrderResponse response =
                StudentRaceFinishOrderResponse.from(FinishOrderProof.unproven(), 5L, 7L);

        JsonNode json = objectMapper.readTree(objectMapper.writeValueAsString(response));

        assertTrue(json.get("confirmedThroughEpochMs").isNull());
        assertEquals(0, json.get("confirmedFinishers").size());
    }
}
