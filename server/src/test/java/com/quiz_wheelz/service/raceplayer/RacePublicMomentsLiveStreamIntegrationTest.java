package com.quiz_wheelz.service.raceplayer;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.json.JsonMapper;
import com.quiz_wheelz.dto.liveevent.QuestionAnsweredLiveEventPayload;
import com.quiz_wheelz.dto.liveevent.RaceLiveEventEnvelope;
import com.quiz_wheelz.dto.liveevent.RaceLiveEventSignal;
import com.quiz_wheelz.dto.liveevent.RacePublicMoment;
import com.quiz_wheelz.enums.RaceLiveEventType;
import com.quiz_wheelz.enums.RacePublicMomentKind;
import com.quiz_wheelz.service.liveevent.RaceLiveEventReplayService;
import com.quiz_wheelz.service.livestream.RaceLiveStreamAudience;
import com.quiz_wheelz.service.livestream.RaceLiveStreamConnection;
import com.quiz_wheelz.service.livestream.RaceLiveStreamCursorResolver;
import com.quiz_wheelz.service.livestream.RaceLiveStreamRegistry;
import com.quiz_wheelz.service.teacher.TeacherRaceLiveStreamDispatcher;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.PageRequest;
import org.springframework.web.servlet.mvc.method.annotation.ResponseBodyEmitter;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

// S4-06 over the real streams (review finding M6, 2026-11-08): the projector gets an answer's public moments with its
// QUESTION_ANSWERED event, a reconnect with Last-Event-ID gets only what came after that id, once, and the student
// stream gets the signal alone. Real events, replay, cursor and dispatchers; only the connection registry is a stub.
@Import({RaceLiveEventReplayService.class, RaceLiveStreamCursorResolver.class})
class RacePublicMomentsLiveStreamIntegrationTest extends B1LuckIntegrationFixture {
    private static final Pattern EVENT_ID = Pattern.compile("id:(\\d+)");
    private static final Set<String> PUBLIC_ANSWER_FIELDS = Set.of("racePlayerId", "questionId", "correct", "moments");

    @Autowired RaceLiveEventReplayService replayService;
    @Autowired RaceLiveStreamCursorResolver cursorResolver;
    private final RaceLiveStreamRegistry registry = mock(RaceLiveStreamRegistry.class);

    @BeforeEach
    void everyConnectionIsOpen() {
        when(registry.contains(any())).thenReturn(true);
    }

    // Draw values as in RacePublicMomentsLuckIntegrationTest: 0.0 hits, then 0.1 gives a Tailwind and 0.9 a Mud.
    @ParameterizedTest
    @CsvSource({"0.1, LUCK_TAILWIND", "0.9, LUCK_MUD"})
    void aProjectorReconnectingWithLastEventIdGetsTheAnswerAndItsMomentOnce(double typeRoll, RacePublicMomentKind kind) {
        long before = liveVersion();
        when(random.nextDouble()).thenReturn(0.0, typeRoll);
        submit(true);
        long answered = answeredVersion();

        var replayed = teacherFrames(Long.toString(before)).stream().filter(frame -> frame.id() == answered).toList();

        assertEquals(1, replayed.size());
        var payload = (QuestionAnsweredLiveEventPayload) ((RaceLiveEventEnvelope<?>) replayed.getFirst().data()).payload();
        assertEquals(List.of(new RacePublicMoment(kind, history().getLast().getId())), payload.moments());
        assertTrue(teacherFrames(Long.toString(answered)).stream().allMatch(frame -> frame.id() > answered));
    }

    @Test
    void anOpenProjectorNeverGetsTheSameEventTwice() {
        when(random.nextDouble()).thenReturn(0.0, 0.1);
        submit(true);
        var emitter = new CapturingEmitter();
        var connection = teacherConnection("0", emitter);
        var dispatcher = new TeacherRaceLiveStreamDispatcher(registry, replayService, clock);

        dispatcher.dispatchConnection(connection);
        int sent = emitter.frames.size();
        dispatcher.dispatchConnection(connection);

        assertTrue(sent > 0);
        assertEquals(sent, emitter.frames.size());
        assertEquals(sent, new HashSet<>(emitter.frames.stream().map(Frame::id).toList()).size());
    }

    @Test
    void theProjectorGetsOnlyThePublicFactsOfTheAnswer() throws Exception {
        when(random.nextDouble()).thenReturn(0.0, 0.1);
        submit(true);
        long answered = answeredVersion();
        var frame = teacherFrames("0").stream().filter(sent -> sent.id() == answered).findFirst().orElseThrow();

        JsonNode payload = JsonMapper.builder().findAndAddModules().build().valueToTree(frame.data()).get("payload");

        Set<String> fields = new HashSet<>();
        payload.fieldNames().forEachRemaining(fields::add);
        assertEquals(PUBLIC_ANSWER_FIELDS, fields);
        assertEquals("LUCK_TAILWIND", payload.get("moments").get(0).get("kind").asText());
        assertFalse(payload.toString().toLowerCase().contains("recovery"));
    }

    @Test
    void theStudentStreamGetsTheSignalOfThatAnswerWithoutItsContent() {
        when(random.nextDouble()).thenReturn(0.0, 0.1);
        submit(true);
        long answered = answeredVersion();
        var emitter = new CapturingEmitter();
        var student = new RaceLiveStreamConnection(UUID.randomUUID(), RaceLiveStreamAudience.STUDENT, raceId, emitter,
                0L, clock.millis());

        new StudentRaceLiveStreamDispatcher(registry, replayService, clock).dispatchConnection(student);

        var frame = emitter.frames.stream().filter(sent -> sent.id() == answered).findFirst().orElseThrow();
        var signal = assertInstanceOf(RaceLiveEventSignal.class, frame.data());
        assertEquals(RaceLiveEventType.QUESTION_ANSWERED, signal.type());
    }

    private List<Frame> teacherFrames(String lastEventId) {
        var emitter = new CapturingEmitter();
        new TeacherRaceLiveStreamDispatcher(registry, replayService, clock)
                .dispatchConnection(teacherConnection(lastEventId, emitter));
        return emitter.frames;
    }

    // The cursor comes from the real resolver, as TeacherRaceLiveStreamService passes it a Last-Event-ID header.
    private RaceLiveStreamConnection teacherConnection(String lastEventId, SseEmitter emitter) {
        long cursor = cursorResolver.resolve(lastEventId, null, liveVersion());
        return new RaceLiveStreamConnection(UUID.randomUUID(), RaceLiveStreamAudience.TEACHER, raceId, emitter, cursor,
                clock.millis());
    }

    private long liveVersion() {
        return transactions.execute(status -> raceRepository.findById(raceId).orElseThrow().getLiveEventVersion());
    }

    private long answeredVersion() {
        return transactions.execute(status -> eventRepository.findAfterVersionOrdered(raceId, 0L, PageRequest.of(0, 100))
                .stream().filter(event -> event.getType() == RaceLiveEventType.QUESTION_ANSWERED)
                .reduce((older, newer) -> newer).orElseThrow().getVersion());
    }

    private record Frame(long id, Object data) {
    }

    // Keeps each event frame the dispatcher sends (its SSE id and its data object); heartbeats carry no id.
    private static final class CapturingEmitter extends SseEmitter {
        private final List<Frame> frames = new ArrayList<>();

        @Override
        public void send(SseEventBuilder builder) {
            List<Object> parts = builder.build().stream().map(ResponseBodyEmitter.DataWithMediaType::getData).toList();
            String text = parts.stream().filter(String.class::isInstance).map(String.class::cast)
                    .reduce("", String::concat);
            Matcher id = EVENT_ID.matcher(text);
            if (id.find()) {
                frames.add(new Frame(Long.parseLong(id.group(1)),
                        parts.stream().filter(part -> !(part instanceof String)).findFirst().orElseThrow()));
            }
        }
    }
}
