package com.quiz_wheelz.service.liveevent;

import com.quiz_wheelz.dto.liveevent.RaceLiveEventEnvelope;
import com.quiz_wheelz.dto.liveevent.RaceLiveEventPayload;
import com.quiz_wheelz.entitys.Race;
import com.quiz_wheelz.entitys.RaceLiveEvent;
import com.quiz_wheelz.enums.RaceLiveEventType;
import com.quiz_wheelz.repository.RaceLiveEventRepository;
import com.quiz_wheelz.repository.RaceRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.util.Objects;

@Service
public class RaceLiveEventService {

    private final RaceRepository raceRepository;
    private final RaceLiveEventRepository eventRepository;
    private final RaceLiveEventPayloadCodec payloadCodec;
    private final Clock clock;

    public RaceLiveEventService(
            RaceRepository raceRepository,
            RaceLiveEventRepository eventRepository,
            RaceLiveEventPayloadCodec payloadCodec,
            Clock clock
    ) {
        this.raceRepository = Objects.requireNonNull(raceRepository);
        this.eventRepository = Objects.requireNonNull(eventRepository);
        this.payloadCodec = Objects.requireNonNull(payloadCodec);
        this.clock = Objects.requireNonNull(clock);
    }

    @Transactional(propagation = Propagation.MANDATORY)
    public <T extends RaceLiveEventPayload> RaceLiveEventEnvelope<T> record(
            Race race,
            RaceLiveEventType type,
            T payload
    ) {
        Objects.requireNonNull(race);
        Long raceId = Objects.requireNonNull(race.getId());
        Objects.requireNonNull(type);
        Objects.requireNonNull(payload);

        int updatedRows = raceRepository.incrementLiveEventVersion(raceId);
        if (updatedRows != 1) {
            throw new IllegalStateException();
        }

        Long version = Objects.requireNonNull(
                raceRepository.findLiveEventVersion(raceId)
        );
        race.setLiveEventVersion(version);
        long occurredAtEpochMs = clock.millis();

        RaceLiveEvent event = new RaceLiveEvent();
        event.setRace(race);
        event.setVersion(version);
        event.setType(type);
        event.setOccurredAtEpochMs(occurredAtEpochMs);
        event.setPayloadJson(payloadCodec.serialize(payload));
        eventRepository.saveAndFlush(event);

        return new RaceLiveEventEnvelope<>(
                raceId,
                version,
                type,
                occurredAtEpochMs,
                payload
        );
    }

}
