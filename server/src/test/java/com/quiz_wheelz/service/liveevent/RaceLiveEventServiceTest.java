package com.quiz_wheelz.service.liveevent;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.quiz_wheelz.dto.liveevent.PlayerProgressUpdatedLiveEventPayload;
import com.quiz_wheelz.dto.liveevent.QuestionAnsweredLiveEventPayload;
import com.quiz_wheelz.dto.liveevent.RaceLiveEventEnvelope;
import com.quiz_wheelz.entitys.Race;
import com.quiz_wheelz.entitys.RaceLiveEvent;
import com.quiz_wheelz.enums.RaceLiveEventType;
import com.quiz_wheelz.repository.RaceLiveEventRepository;
import com.quiz_wheelz.repository.RaceRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.lang.reflect.Method;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RaceLiveEventServiceTest {

    private static final Instant NOW = Instant.parse("2026-08-24T15:16:17Z");

    @Mock
    private RaceRepository raceRepository;

    @Mock
    private RaceLiveEventRepository eventRepository;

    private RaceLiveEventService service;

    @BeforeEach
    void setUp() {
        service = new RaceLiveEventService(
                raceRepository,
                eventRepository,
                new ObjectMapper(),
                Clock.fixed(NOW, ZoneOffset.UTC)
        );
    }

    @Test
    void allocatesWithAtomicDatabaseUpdateAndPersistsFixedClockEvent() {
        Race race = race(11L, 4L);
        QuestionAnsweredLiveEventPayload payload =
                new QuestionAnsweredLiveEventPayload(17L, 29L, false);
        when(raceRepository.incrementLiveEventVersion(11L)).thenReturn(1);
        when(raceRepository.findLiveEventVersion(11L)).thenReturn(5L);

        RaceLiveEventEnvelope<QuestionAnsweredLiveEventPayload> envelope =
                service.record(race, RaceLiveEventType.QUESTION_ANSWERED, payload);

        ArgumentCaptor<RaceLiveEvent> captor = ArgumentCaptor.forClass(RaceLiveEvent.class);
        verify(raceRepository).incrementLiveEventVersion(11L);
        verify(raceRepository).findLiveEventVersion(11L);
        verify(eventRepository).saveAndFlush(captor.capture());
        RaceLiveEvent event = captor.getValue();
        assertSame(race, event.getRace());
        assertEquals(5L, event.getVersion());
        assertEquals(RaceLiveEventType.QUESTION_ANSWERED, event.getType());
        assertEquals(NOW.toEpochMilli(), event.getOccurredAtEpochMs());
        assertEquals("{\"racePlayerId\":17,\"questionId\":29,\"correct\":false}", event.getPayloadJson());
        assertEquals(5L, race.getLiveEventVersion());
        assertEquals(11L, envelope.raceId());
        assertEquals(5L, envelope.version());
        assertEquals(NOW.toEpochMilli(), envelope.occurredAtEpochMs());
        assertSame(payload, envelope.payload());
    }

    @Test
    void rejectsMissingRaceRowInsteadOfCreatingAnUnversionedEvent() {
        Race race = race(11L, 0L);
        when(raceRepository.incrementLiveEventVersion(11L)).thenReturn(0);

        assertThrows(
                IllegalStateException.class,
                () -> service.record(
                        race,
                        RaceLiveEventType.PLAYER_PROGRESS_UPDATED,
                        new PlayerProgressUpdatedLiveEventPayload(List.of())
                )
        );
    }

    @Test
    void recordRequiresAnExistingTransaction() throws NoSuchMethodException {
        Method method = RaceLiveEventService.class.getMethod(
                "record",
                Race.class,
                RaceLiveEventType.class,
                com.quiz_wheelz.dto.liveevent.RaceLiveEventPayload.class
        );
        Transactional transactional = method.getAnnotation(Transactional.class);

        assertEquals(Propagation.MANDATORY, transactional.propagation());
    }

    @Test
    void durableWriterHasNoRedisOrJvmSequenceDependency() {
        List<String> dependencyTypes = Arrays.stream(
                        RaceLiveEventService.class.getDeclaredFields()
                )
                .map(field -> field.getType().getName())
                .toList();

        assertFalse(dependencyTypes.stream().anyMatch(name -> name.contains("redis")));
        assertFalse(dependencyTypes.stream().anyMatch(name -> name.contains("Atomic")));
    }

    private Race race(Long id, Long version) {
        Race race = new Race();
        race.setId(id);
        race.setLiveEventVersion(version);
        return race;
    }
}
