package com.quiz_wheelz.service.liveevent;

import com.quiz_wheelz.common.TeacherRaceLiveStreamRules;
import com.quiz_wheelz.dto.liveevent.RaceLiveEventEnvelope;
import com.quiz_wheelz.dto.liveevent.RaceLiveEventPayload;
import com.quiz_wheelz.entitys.RaceLiveEvent;
import com.quiz_wheelz.repository.RaceLiveEventRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;

@Service
public class RaceLiveEventReplayService {

    private final RaceLiveEventRepository eventRepository;
    private final RaceLiveEventPayloadCodec payloadCodec;

    public RaceLiveEventReplayService(
            RaceLiveEventRepository eventRepository,
            RaceLiveEventPayloadCodec payloadCodec
    ) {
        this.eventRepository = Objects.requireNonNull(eventRepository);
        this.payloadCodec = Objects.requireNonNull(payloadCodec);
    }

    @Transactional(readOnly = true)
    public List<RaceLiveEventEnvelope<RaceLiveEventPayload>> readNextBatch(
            Long raceId,
            long afterVersion
    ) {
        Objects.requireNonNull(raceId);
        return eventRepository.findAfterVersionOrdered(
                        raceId,
                        afterVersion,
                        PageRequest.of(0, TeacherRaceLiveStreamRules.REPLAY_BATCH_SIZE)
                )
                .stream()
                .map(this::toEnvelope)
                .toList();
    }

    private RaceLiveEventEnvelope<RaceLiveEventPayload> toEnvelope(
            RaceLiveEvent event
    ) {
        return new RaceLiveEventEnvelope<>(
                Objects.requireNonNull(event.getRace().getId()),
                event.getVersion(),
                event.getType(),
                event.getOccurredAtEpochMs(),
                payloadCodec.deserialize(event.getType(), event.getPayloadJson())
        );
    }
}
