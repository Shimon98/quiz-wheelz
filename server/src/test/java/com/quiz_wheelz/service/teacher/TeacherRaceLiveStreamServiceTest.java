package com.quiz_wheelz.service.teacher;

import com.quiz_wheelz.dto.liveevent.QuestionAnsweredLiveEventPayload;
import com.quiz_wheelz.dto.liveevent.RaceLiveEventEnvelope;
import com.quiz_wheelz.dto.liveevent.RaceLiveEventPayload;
import com.quiz_wheelz.entitys.Race;
import com.quiz_wheelz.enums.RaceLiveEventType;
import com.quiz_wheelz.exception.ApiException;
import com.quiz_wheelz.exception.ErrorCode;
import com.quiz_wheelz.service.liveevent.RaceLiveEventReplayService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.servlet.mvc.method.annotation.ResponseBodyEmitter;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TeacherRaceLiveStreamServiceTest {

    @Mock
    private TeacherRaceAccessService raceAccessService;

    @Mock
    private TeacherRaceLiveEmitterFactory emitterFactory;

    @Mock
    private RaceLiveEventReplayService replayService;

    private TeacherRaceLiveStreamRegistry registry;
    private TeacherRaceLiveStreamService service;

    @BeforeEach
    void setUp() {
        Clock clock = Clock.fixed(Instant.ofEpochMilli(1_000L), ZoneOffset.UTC);
        registry = new TeacherRaceLiveStreamRegistry(emitterFactory, clock);
        TeacherRaceLiveStreamDispatcher dispatcher =
                new TeacherRaceLiveStreamDispatcher(registry, replayService, clock);
        service = new TeacherRaceLiveStreamService(
                raceAccessService,
                new TeacherRaceLiveCursorResolver(),
                registry,
                dispatcher
        );
    }

    @Test
    void ownerConnectsAndEventCommittedAfterLiveStateIsImmediatelyReplayed() {
        CapturingEmitter emitter = new CapturingEmitter();
        Race race = race(12L, 5L);
        RaceLiveEventEnvelope<RaceLiveEventPayload> fifth = event(12L, 5L);
        when(raceAccessService.requireOwnedRace(12L)).thenReturn(race);
        when(emitterFactory.create()).thenReturn(emitter);
        when(replayService.readNextBatch(12L, 4L)).thenReturn(List.of(fifth));

        SseEmitter result = service.connect(12L, "4", null);

        assertSame(emitter, result);
        assertEquals(1, registry.size());
        assertEquals(5L, registry.activeConnections().getFirst().lastDeliveredVersion());
        assertEquals(1, emitter.frames.size());
        List<Object> wireData = emitter.frames.getFirst().stream()
                .map(ResponseBodyEmitter.DataWithMediaType::getData)
                .toList();
        String controlData = wireData.stream()
                .filter(String.class::isInstance)
                .map(String.class::cast)
                .reduce("", String::concat);
        assertTrue(controlData.contains("id:5"));
        assertSame(fifth, wireData.stream()
                .filter(RaceLiveEventEnvelope.class::isInstance)
                .findFirst()
                .orElseThrow());
    }

    @Test
    void foreignTeacherIsRejectedBeforeEmitterRegistration() {
        when(raceAccessService.requireOwnedRace(91L))
                .thenThrow(new ApiException(ErrorCode.RACE_NOT_FOUND));

        ApiException exception = assertThrows(
                ApiException.class,
                () -> service.connect(91L, "0", null)
        );

        assertEquals(ErrorCode.RACE_NOT_FOUND, exception.getErrorCode());
        assertEquals(0, registry.size());
        verifyNoInteractions(emitterFactory, replayService);
    }

    @Test
    void missingRaceUsesTheSameHiddenErrorBeforeEmitterRegistration() {
        when(raceAccessService.requireOwnedRace(404L))
                .thenThrow(new ApiException(ErrorCode.RACE_NOT_FOUND));

        ApiException exception = assertThrows(
                ApiException.class,
                () -> service.connect(404L, "0", null)
        );

        assertEquals(ErrorCode.RACE_NOT_FOUND, exception.getErrorCode());
        assertEquals(0, registry.size());
        verifyNoInteractions(emitterFactory, replayService);
    }

    private Race race(Long id, Long version) {
        Race race = new Race();
        race.setId(id);
        race.setLiveEventVersion(version);
        return race;
    }

    private RaceLiveEventEnvelope<RaceLiveEventPayload> event(Long raceId, Long version) {
        return new RaceLiveEventEnvelope<>(
                raceId,
                version,
                RaceLiveEventType.QUESTION_ANSWERED,
                1_000L + version,
                new QuestionAnsweredLiveEventPayload(1L, 2L, true)
        );
    }

    private static final class CapturingEmitter extends SseEmitter {

        private final List<Set<ResponseBodyEmitter.DataWithMediaType>> frames =
                new ArrayList<>();

        @Override
        public void send(SseEventBuilder builder) {
            frames.add(builder.build());
        }
    }
}
