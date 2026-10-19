package com.quiz_wheelz.service.luck;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import java.nio.file.*;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;

class C1FairnessWindowTest {
    @Test
    void identicalManualAnswerTimelineComparesInclusiveWindowsWithoutChangingRuntime() throws Exception {
        var policy = new RaceLuckFairnessPolicy();
        var rows = new ArrayList<Map<String, Object>>();
        long initial = 1_000_000;
        for (long window : new long[]{30000, 60000, 90000}) {
            for (long elapsed : new long[]{29999, 30000, 30001, 44999, 45000, 45001, 60000, 60001, 90000, 90001}) {
                long now = initial + elapsed;
                var current = new RaceLuckFairnessPolicy.Candidate(1, 1, 1L, now, true);
                var idle = new RaceLuckFairnessPolicy.Candidate(2, 0, null, initial, true);
                boolean deferred = policy.defer(current, List.of(idle), 1L, 1L, now, window);
                assertEquals(elapsed <= window, deferred);
                var attempted = new RaceLuckFairnessPolicy.Candidate(2, 0, 2L, now, true);
                assertFalse(policy.defer(current, List.of(attempted), 1L, 1L, now, window));
                rows.add(Map.of("windowMs", window, "elapsedMs", elapsed,
                        "fairnessDeferred", deferred, "resumesAfterNoEvent", true,
                        "ownCooldownElapsed", elapsed >= 45000));
            }
        }
        Files.createDirectories(Path.of("target", "c1-evidence"));
        Files.writeString(Path.of("target", "c1-evidence", "window-comparison.json"),
                new ObjectMapper().writerWithDefaultPrettyPrinter().writeValueAsString(rows));
        assertEquals(60000, com.quiz_wheelz.common.LuckRules.PROVISIONAL_ACTIVITY_WINDOW_MS);
    }
}
