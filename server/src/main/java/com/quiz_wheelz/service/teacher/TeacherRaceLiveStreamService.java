package com.quiz_wheelz.service.teacher;

import com.quiz_wheelz.service.livestream.RaceLiveStreamAudience;

import com.quiz_wheelz.service.livestream.RaceLiveStreamConnection;
import com.quiz_wheelz.service.livestream.RaceLiveStreamRegistry;
import com.quiz_wheelz.service.livestream.RaceLiveStreamCursorResolver;

import com.quiz_wheelz.entitys.Race;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.Objects;

@Service
public class TeacherRaceLiveStreamService {

    private final TeacherRaceAccessService raceAccessService;
    private final RaceLiveStreamCursorResolver cursorResolver;
    private final RaceLiveStreamRegistry registry;
    private final TeacherRaceLiveStreamDispatcher dispatcher;

    public TeacherRaceLiveStreamService(
            TeacherRaceAccessService raceAccessService,
            RaceLiveStreamCursorResolver cursorResolver,
            RaceLiveStreamRegistry registry,
            TeacherRaceLiveStreamDispatcher dispatcher
    ) {
        this.raceAccessService = Objects.requireNonNull(raceAccessService);
        this.cursorResolver = Objects.requireNonNull(cursorResolver);
        this.registry = Objects.requireNonNull(registry);
        this.dispatcher = Objects.requireNonNull(dispatcher);
    }

    public SseEmitter connect(
            Long raceId,
            String afterVersion,
            String lastEventId
    ) {
        Race race = raceAccessService.requireOwnedRace(raceId);
        long cursor = cursorResolver.resolve(
                lastEventId,
                afterVersion,
                Objects.requireNonNull(race.getLiveEventVersion())
        );
        RaceLiveStreamConnection connection = registry.register(
                RaceLiveStreamAudience.TEACHER, race.getId(), cursor
        );
        dispatcher.dispatchConnection(connection);
        return connection.emitter();
    }
}
