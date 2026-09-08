package com.quiz_wheelz.service.liveevent;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.quiz_wheelz.dto.liveevent.PlayerFinishedLiveEventPayload;
import com.quiz_wheelz.dto.liveevent.PlayerJoinedLiveEventPayload;
import com.quiz_wheelz.dto.liveevent.PlayerProgressUpdatedLiveEventPayload;
import com.quiz_wheelz.dto.liveevent.QuestionAnsweredLiveEventPayload;
import com.quiz_wheelz.dto.liveevent.RaceFinishedLiveEventPayload;
import com.quiz_wheelz.dto.liveevent.RaceLiveEventPayload;
import com.quiz_wheelz.dto.liveevent.RaceStartedLiveEventPayload;
import com.quiz_wheelz.enums.RaceLiveEventType;
import org.springframework.stereotype.Service;

import java.util.Objects;

@Service
public class RaceLiveEventPayloadCodec {

    private final ObjectMapper objectMapper;

    public RaceLiveEventPayloadCodec(ObjectMapper objectMapper) {
        this.objectMapper = Objects.requireNonNull(objectMapper);
    }

    public String serialize(RaceLiveEventPayload payload) {
        try {
            return objectMapper.writeValueAsString(Objects.requireNonNull(payload));
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException(exception);
        }
    }

    public RaceLiveEventPayload deserialize(
            RaceLiveEventType type,
            String payloadJson
    ) {
        Objects.requireNonNull(type);
        Objects.requireNonNull(payloadJson);
        try {
            return objectMapper.readValue(payloadJson, payloadType(type));
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException(exception);
        }
    }

    private Class<? extends RaceLiveEventPayload> payloadType(RaceLiveEventType type) {
        return switch (type) {
            case PLAYER_JOINED -> PlayerJoinedLiveEventPayload.class;
            case RACE_STARTED -> RaceStartedLiveEventPayload.class;
            case QUESTION_ANSWERED -> QuestionAnsweredLiveEventPayload.class;
            case PLAYER_PROGRESS_UPDATED -> PlayerProgressUpdatedLiveEventPayload.class;
            case PLAYER_FINISHED -> PlayerFinishedLiveEventPayload.class;
            case RACE_FINISHED -> RaceFinishedLiveEventPayload.class;
        };
    }
}
