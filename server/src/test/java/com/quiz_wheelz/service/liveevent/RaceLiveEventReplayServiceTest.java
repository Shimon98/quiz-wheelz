package com.quiz_wheelz.service.liveevent;

import com.quiz_wheelz.common.TeacherRaceLiveStreamRules;
import com.quiz_wheelz.dto.liveevent.QuestionAnsweredLiveEventPayload;
import com.quiz_wheelz.dto.liveevent.RaceLiveEventEnvelope;
import com.quiz_wheelz.dto.liveevent.RaceLiveEventPayload;
import com.quiz_wheelz.entitys.Race;
import com.quiz_wheelz.entitys.RaceLiveEvent;
import com.quiz_wheelz.enums.RaceLiveEventType;
import com.quiz_wheelz.repository.RaceLiveEventRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.SliceImpl;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RaceLiveEventReplayServiceTest {

    @Mock
    private RaceLiveEventRepository eventRepository;

    @Mock
    private RaceLiveEventPayloadCodec payloadCodec;

    private RaceLiveEventReplayService service;

    @BeforeEach
    void setUp() {
        service = new RaceLiveEventReplayService(eventRepository, payloadCodec);
    }

    @Test
    void replayIsRaceScopedAscendingAndBounded() {
        RaceLiveEvent versionThree = event(12L, 3L);
        RaceLiveEvent versionFour = event(12L, 4L);
        when(eventRepository.findAfterVersionOrdered(
                org.mockito.ArgumentMatchers.eq(12L),
                org.mockito.ArgumentMatchers.eq(2L),
                org.mockito.ArgumentMatchers.any(Pageable.class)
        )).thenReturn(new SliceImpl<>(List.of(versionThree, versionFour)));
        when(payloadCodec.deserialize(
                RaceLiveEventType.QUESTION_ANSWERED,
                versionThree.getPayloadJson()
        )).thenReturn(payload());
        when(payloadCodec.deserialize(
                RaceLiveEventType.QUESTION_ANSWERED,
                versionFour.getPayloadJson()
        )).thenReturn(payload());

        List<RaceLiveEventEnvelope<RaceLiveEventPayload>> replay =
                service.readNextBatch(12L, 2L);

        assertEquals(List.of(3L, 4L), replay.stream().map(RaceLiveEventEnvelope::version).toList());
        assertEquals(List.of(12L, 12L), replay.stream().map(RaceLiveEventEnvelope::raceId).toList());
        ArgumentCaptor<Pageable> pageable = ArgumentCaptor.forClass(Pageable.class);
        verify(eventRepository).findAfterVersionOrdered(
                org.mockito.ArgumentMatchers.eq(12L),
                org.mockito.ArgumentMatchers.eq(2L),
                pageable.capture()
        );
        assertEquals(0, pageable.getValue().getPageNumber());
        assertEquals(TeacherRaceLiveStreamRules.REPLAY_BATCH_SIZE, pageable.getValue().getPageSize());
        assertFalse(pageable.getValue().isUnpaged());
    }

    @Test
    void continuationUsesLastVersionAsANewCursorAndRestartsAtPageZero() {
        when(eventRepository.findAfterVersionOrdered(
                org.mockito.ArgumentMatchers.anyLong(),
                org.mockito.ArgumentMatchers.anyLong(),
                org.mockito.ArgumentMatchers.any(Pageable.class)
        )).thenReturn(new SliceImpl<>(List.of()));

        service.readNextBatch(12L, 100L);
        service.readNextBatch(12L, 200L);

        ArgumentCaptor<Long> cursors = ArgumentCaptor.forClass(Long.class);
        ArgumentCaptor<Pageable> pages = ArgumentCaptor.forClass(Pageable.class);
        verify(eventRepository, org.mockito.Mockito.times(2)).findAfterVersionOrdered(
                org.mockito.ArgumentMatchers.eq(12L),
                cursors.capture(),
                pages.capture()
        );
        assertEquals(List.of(100L, 200L), cursors.getAllValues());
        assertEquals(List.of(0, 0), pages.getAllValues().stream().map(Pageable::getPageNumber).toList());
    }

    private RaceLiveEvent event(Long raceId, Long version) {
        Race race = new Race();
        race.setId(raceId);
        RaceLiveEvent event = new RaceLiveEvent();
        event.setRace(race);
        event.setVersion(version);
        event.setType(RaceLiveEventType.QUESTION_ANSWERED);
        event.setOccurredAtEpochMs(1_000L + version);
        event.setPayloadJson("{\"racePlayerId\":1,\"questionId\":2,\"correct\":true}");
        return event;
    }

    private QuestionAnsweredLiveEventPayload payload() {
        return new QuestionAnsweredLiveEventPayload(1L, 2L, true);
    }
}
