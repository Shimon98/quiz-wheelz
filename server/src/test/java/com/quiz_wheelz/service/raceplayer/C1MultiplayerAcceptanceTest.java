package com.quiz_wheelz.service.raceplayer;

import com.quiz_wheelz.enums.*;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;
import org.junit.jupiter.params.provider.Arguments;
import java.util.*;
import java.util.stream.Stream;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class C1MultiplayerAcceptanceTest extends C1RaceAcceptanceFixture {
    static Stream<Arguments> races() {
        return Stream.of(2, 4, 8).flatMap(players -> Stream.of(100, 300, 1000).flatMap(length ->
                Stream.of(7L, 41L, 2026L).map(seed -> Arguments.of(players, length, seed))));
    }

    @ParameterizedTest
    @MethodSource("races")
    void seededFullRacesCharacterizeOpportunitiesAndPreserveEducation(int count, int length, long seed) throws Exception {
        observe();
        var results = new LinkedHashMap<String, Object>();
        for (boolean on : new boolean[]{false, true}) {
            enabled(on);
            clock.set(T + seed * 1000);
            var rng = new Random(seed);
            when(random.nextDouble()).thenAnswer(call -> rng.nextDouble());
            trace.clear();
            var ids = newRace(count, length);
            var finished = new HashSet<Long>();
            for (int round = 0; round < 160 && finished.size() < count; round++) {
                for (int index = 0; index < count; index++) {
                    long id = ids.get(index);
                    if (finished.contains(id)) continue;
                    var snapshot = get(id);
                    if (snapshot.isPlayerFinished()) {
                        finished.add(id);
                        continue;
                    }
                    if (snapshot.getGameplay().mode() != RacePlayerGameplayMode.NORMAL) continue;
                    if (index % 3 == 2 && round >= 5 && round <= 12) continue;
                    boolean correct = (round + index + seed) % 5 < (index % 3 == 0 ? 4 : index % 3 == 1 ? 2 : 1);
                    var after = accept(id, correct, round, on);
                    if (after.isPlayerFinished()) finished.add(id);
                }
                clock.set(clock.millis() + 6000 + seed % 3 * 1000);
            }
            assertEquals(count, finished.size());
            var terminals = new ArrayList<Object>();
            for (long id : ids) {
                var snapshot = get(id);
                assertEquals((double) length, snapshot.getPosition());
                assertEquals(0.0, snapshot.getMovementUnitsPerSecond());
                assertTrue(snapshot.getGameplay().activeEffects().isEmpty());
                assertEquals(count, snapshot.getPlayerCount());
                assertTrue(snapshot.getRank() >= 1 && snapshot.getRank() <= count);
                assertTrue(snapshot.getGameplay().luck().recentEvents().size() <= 2);
                terminals.add(snapshot);
            }
            assertEquals(RaceStatus.FINISHED, race().getStatus());
            var rows = new ArrayList<>(trace);
            results.put(on ? "ON" : "OFF", Map.of("players", ids, "answers", rows, "terminal", terminals));
        }
        enabled(true);
        evidence("race-" + count + "-" + length + "-" + seed, results);
    }
}
