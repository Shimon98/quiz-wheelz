package com.quiz_wheelz.service.teacher;

import com.quiz_wheelz.service.livestream.RaceLiveStreamRegistry;

import com.quiz_wheelz.service.liveevent.RaceLiveEventReplayService;
import org.junit.jupiter.api.Test;

import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertFalse;

class TeacherRaceLiveStreamArchitectureTest {

    @Test
    void streamAndReplayTruthHaveNoLegacySseOrRedisDependencies() {
        List<Class<?>> owners = List.of(
                TeacherRaceLiveStreamService.class,
                RaceLiveStreamRegistry.class,
                TeacherRaceLiveStreamDispatcher.class,
                RaceLiveEventReplayService.class
        );

        boolean forbiddenDependency = owners.stream()
                .flatMap(owner -> Arrays.stream(owner.getDeclaredFields()))
                .map(field -> field.getType().getName())
                .anyMatch(name -> name.contains(".sse.SseService") || name.contains("redis"));

        assertFalse(forbiddenDependency);
    }
}
