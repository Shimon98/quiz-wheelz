package com.quiz_wheelz.service.liveevent;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.quiz_wheelz.entitys.Race;
import com.quiz_wheelz.entitys.RaceLiveEvent;
import com.quiz_wheelz.entitys.RacePlayer;
import com.quiz_wheelz.entitys.Subject;
import com.quiz_wheelz.entitys.User;
import com.quiz_wheelz.enums.RacePlayerStatus;
import com.quiz_wheelz.enums.RaceStatus;
import com.quiz_wheelz.repository.RaceLiveEventRepository;
import com.quiz_wheelz.repository.RacePlayerRepository;
import com.quiz_wheelz.repository.RaceRepository;
import com.quiz_wheelz.service.raceplayer.RaceStandingCalculator;
import com.quiz_wheelz.service.teacher.TeacherRaceLivePlayerSnapshotService;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.assertEquals;

@DataJpaTest
@ActiveProfiles("test")
@Transactional(propagation = Propagation.NOT_SUPPORTED)
@Import({
        RaceLiveEventService.class,
        RaceLiveEventRecorder.class,
        RaceLiveMutationGate.class,
        TeacherRaceLivePlayerSnapshotService.class,
        RaceStandingCalculator.class,
        RaceLiveMutationOrderingIntegrationTest.FixedTimeConfiguration.class
})
class RaceLiveMutationOrderingIntegrationTest {

    private static final Instant NOW = Instant.parse("2026-08-24T18:00:00Z");
    private static final AtomicInteger TEST_SEQUENCE = new AtomicInteger();

    @Autowired
    private RacePlayerRepository racePlayerRepository;

    @Autowired
    private RaceRepository raceRepository;

    @Autowired
    private RaceLiveEventRepository eventRepository;

    @Autowired
    private RaceLiveMutationGate liveMutationGate;

    @Autowired
    private RaceLiveEventRecorder eventRecorder;

    @Autowired
    private PlatformTransactionManager transactionManager;

    @Autowired
    private EntityManager entityManager;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void higherVersionSnapshotContainsBothConcurrentPlayerMutationsAndRanks()
            throws Exception {
        PersistedRace persisted = persistRaceWithTwoPlayers();
        CountDownLatch playersLocked = new CountDownLatch(2);
        CountDownLatch acquireRaceGate = new CountDownLatch(1);
        ExecutorService executor = Executors.newFixedThreadPool(2);

        try {
            Future<?> first = executor.submit(() -> mutateAndRecord(
                    persisted.firstPlayerId(),
                    persisted.raceId(),
                    100.0,
                    playersLocked,
                    acquireRaceGate
            ));
            Future<?> second = executor.submit(() -> mutateAndRecord(
                    persisted.secondPlayerId(),
                    persisted.raceId(),
                    200.0,
                    playersLocked,
                    acquireRaceGate
            ));

            playersLocked.await(10, TimeUnit.SECONDS);
            acquireRaceGate.countDown();
            first.get(10, TimeUnit.SECONDS);
            second.get(10, TimeUnit.SECONDS);

            List<RaceLiveEvent> events = eventRepository.findAfterVersionOrdered(
                    persisted.raceId(),
                    0L
            );
            assertEquals(List.of(1L, 2L), events.stream()
                    .map(RaceLiveEvent::getVersion)
                    .toList());
            assertEquals(2L, currentRaceVersion(persisted.raceId()));

            JsonNode players = objectMapper.readTree(events.getLast().getPayloadJson())
                    .get("players");
            assertEquals(2, players.size());
            assertPlayer(players, persisted.firstPlayerId(), 100.0, 2);
            assertPlayer(players, persisted.secondPlayerId(), 200.0, 1);
        } finally {
            executor.shutdownNow();
        }
    }

    private void mutateAndRecord(
            Long playerId,
            Long raceId,
            double position,
            CountDownLatch playersLocked,
            CountDownLatch acquireRaceGate
    ) {
        transactions().executeWithoutResult(status -> {
            RacePlayer racePlayer = racePlayerRepository
                    .findLockedByIdAndRaceId(playerId, raceId)
                    .orElseThrow();
            playersLocked.countDown();
            await(acquireRaceGate);

            Race race = liveMutationGate.lockIfActive(racePlayer).orElseThrow();
            racePlayer.setPosition(position);
            eventRecorder.recordPlayerProgressUpdated(race);
        });
    }

    private void assertPlayer(
            JsonNode players,
            Long playerId,
            double position,
            int rank
    ) {
        for (JsonNode player : players) {
            if (player.get("racePlayerId").asLong() == playerId) {
                assertEquals(position, player.get("position").asDouble());
                assertEquals(rank, player.get("rank").asInt());
                return;
            }
        }
        throw new IllegalStateException();
    }

    private PersistedRace persistRaceWithTwoPlayers() {
        int sequence = TEST_SEQUENCE.incrementAndGet();
        return transactions().execute(status -> {
            User teacher = new User();
            teacher.setUsername("ordering-teacher-" + sequence);
            teacher.setDisplayName("Ordering Teacher");
            entityManager.persist(teacher);

            Subject subject = new Subject();
            subject.setName("Ordering Math " + sequence);
            subject.setCode("ORDERING_MATH_" + sequence);
            entityManager.persist(subject);

            Race race = new Race();
            race.setRoomCode(String.format("O%05d", sequence));
            race.setTitle("Concurrent snapshot ordering");
            race.setStatus(RaceStatus.IN_PROGRESS);
            race.setMaxPlayers(4);
            race.setTotalDistance(1000);
            race.setTeacher(teacher);
            race.setSubject(subject);
            entityManager.persist(race);

            RacePlayer first = racingPlayer(race, "Noa", 1);
            RacePlayer second = racingPlayer(race, "Amit", 2);
            entityManager.persist(first);
            entityManager.persist(second);
            entityManager.flush();
            return new PersistedRace(race.getId(), first.getId(), second.getId());
        });
    }

    private RacePlayer racingPlayer(Race race, String name, int lane) {
        RacePlayer racePlayer = new RacePlayer();
        racePlayer.setRace(race);
        racePlayer.setDisplayName(name);
        racePlayer.setLaneNumber(lane);
        racePlayer.setStatus(RacePlayerStatus.RACING);
        return racePlayer;
    }

    private Long currentRaceVersion(Long raceId) {
        return transactions().execute(status ->
                raceRepository.findById(raceId).orElseThrow().getLiveEventVersion()
        );
    }

    private void await(CountDownLatch latch) {
        try {
            if (!latch.await(10, TimeUnit.SECONDS)) {
                throw new IllegalStateException();
            }
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException(exception);
        }
    }

    private TransactionTemplate transactions() {
        return new TransactionTemplate(transactionManager);
    }

    private record PersistedRace(
            Long raceId,
            Long firstPlayerId,
            Long secondPlayerId
    ) {
    }

    @TestConfiguration
    static class FixedTimeConfiguration {

        @Bean
        ObjectMapper objectMapper() {
            return new ObjectMapper();
        }

        @Bean
        Clock clock() {
            return Clock.fixed(NOW, ZoneOffset.UTC);
        }
    }
}
