package com.quiz_wheelz.service.liveevent;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.quiz_wheelz.dto.liveevent.PlayerFinishedLiveEventPayload;
import com.quiz_wheelz.dto.liveevent.PlayerJoinedLiveEventPayload;
import com.quiz_wheelz.dto.liveevent.PlayerProgressUpdatedLiveEventPayload;
import com.quiz_wheelz.dto.liveevent.QuestionAnsweredLiveEventPayload;
import com.quiz_wheelz.dto.liveevent.RaceFinishedLiveEventPayload;
import com.quiz_wheelz.dto.liveevent.RaceLiveEventPayload;
import com.quiz_wheelz.dto.liveevent.RaceStartedLiveEventPayload;
import com.quiz_wheelz.dto.teacher.TeacherRaceLivePlayerResponse;
import com.quiz_wheelz.enums.RaceLiveEventType;
import com.quiz_wheelz.enums.RaceStatus;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

import java.util.List;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;

class RaceLiveEventPayloadCodecTest {

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final RaceLiveEventPayloadCodec codec =
            new RaceLiveEventPayloadCodec(objectMapper);

    @ParameterizedTest
    @MethodSource("payloads")
    void everyDurableEventPayloadRoundTripsWithTheConfiguredMapper(
            RaceLiveEventType type,
            RaceLiveEventPayload payload
    ) throws Exception {
        String json = codec.serialize(payload);

        RaceLiveEventPayload decoded = codec.deserialize(type, json);

        assertEquals(payload.getClass(), decoded.getClass());
        assertEquals(
                objectMapper.readTree(json),
                objectMapper.readTree(codec.serialize(decoded))
        );
        if (type == RaceLiveEventType.QUESTION_ANSWERED) {
            assertFalse(json.contains("answer"));
            assertFalse(json.contains("choice"));
        }
    }

    private static Stream<Arguments> payloads() {
        TeacherRaceLivePlayerResponse player = player();
        return Stream.of(
                Arguments.of(
                        RaceLiveEventType.PLAYER_JOINED,
                        new PlayerJoinedLiveEventPayload(player)
                ),
                Arguments.of(
                        RaceLiveEventType.RACE_STARTED,
                        new RaceStartedLiveEventPayload(
                                RaceStatus.IN_PROGRESS,
                                100L,
                                List.of(player)
                        )
                ),
                Arguments.of(
                        RaceLiveEventType.QUESTION_ANSWERED,
                        new QuestionAnsweredLiveEventPayload(1L, 2L, true)
                ),
                Arguments.of(
                        RaceLiveEventType.PLAYER_PROGRESS_UPDATED,
                        new PlayerProgressUpdatedLiveEventPayload(List.of(player))
                ),
                Arguments.of(
                        RaceLiveEventType.PLAYER_FINISHED,
                        new PlayerFinishedLiveEventPayload(player, 200L, List.of(player))
                ),
                Arguments.of(
                        RaceLiveEventType.RACE_FINISHED,
                        new RaceFinishedLiveEventPayload(
                                RaceStatus.FINISHED,
                                300L,
                                List.of(player)
                        )
                )
        );
    }

    private static TeacherRaceLivePlayerResponse player() {
        return new TeacherRaceLivePlayerResponse(
                1L,
                "Player",
                1,
                "HOVER_KART",
                "GREEN",
                "HOVER_KART_GREEN",
                1,
                400.0,
                1.5,
                20,
                2,
                "RACING"
        );
    }
}
