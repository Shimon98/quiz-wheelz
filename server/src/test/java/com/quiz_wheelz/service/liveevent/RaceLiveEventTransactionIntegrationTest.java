package com.quiz_wheelz.service.liveevent;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.quiz_wheelz.dto.liveevent.PlayerProgressUpdatedLiveEventPayload;
import com.quiz_wheelz.dto.teacher.TeacherRaceLiveStateResponse;
import com.quiz_wheelz.entitys.Race;
import com.quiz_wheelz.entitys.RaceLiveEvent;
import com.quiz_wheelz.entitys.Subject;
import com.quiz_wheelz.entitys.User;
import com.quiz_wheelz.enums.RaceLiveEventType;
import com.quiz_wheelz.repository.RaceLiveEventRepository;
import com.quiz_wheelz.repository.RaceRepository;
import com.quiz_wheelz.service.auth.CurrentUserService;
import com.quiz_wheelz.service.auth.UserService;
import com.quiz_wheelz.service.teacher.TeacherRaceLivePlayerSnapshotService;
import com.quiz_wheelz.service.teacher.TeacherRaceLiveStateService;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.IllegalTransactionStateException;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Set;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@DataJpaTest
@ActiveProfiles("test")
@Transactional(propagation = Propagation.NOT_SUPPORTED)
@Import({
        RaceLiveEventService.class,
        RaceLiveEventTransactionIntegrationTest.FixedTimeConfiguration.class
})
class RaceLiveEventTransactionIntegrationTest {

    private static final Instant NOW = Instant.parse("2026-08-24T16:00:00Z");
    private static final AtomicInteger TEST_SEQUENCE = new AtomicInteger();

    @Autowired
    private RaceRepository raceRepository;

    @Autowired
    private RaceLiveEventRepository eventRepository;

    @Autowired
    private PlatformTransactionManager transactionManager;

    @Autowired
    private EntityManager entityManager;

    @Autowired
    private RaceLiveEventService eventService;

    @Test
    void concurrentSameRaceWritesCommitDistinctSequentialVersions() throws Exception {
        Long raceId = persistRace("Concurrent race").raceId();
        CountDownLatch ready = new CountDownLatch(2);
        CountDownLatch start = new CountDownLatch(1);
        ExecutorService executor = Executors.newFixedThreadPool(2);

        try {
            Future<Long> first = executor.submit(() -> recordAfterSignal(raceId, ready, start));
            Future<Long> second = executor.submit(() -> recordAfterSignal(raceId, ready, start));
            ready.await(10, TimeUnit.SECONDS);
            start.countDown();

            Set<Long> committedVersions = Set.of(
                    first.get(10, TimeUnit.SECONDS),
                    second.get(10, TimeUnit.SECONDS)
            );

            assertEquals(Set.of(1L, 2L), committedVersions);
            assertEquals(List.of(1L, 2L), eventVersionsAfter(raceId, 0L));
            assertEquals(2L, currentVersion(raceId));
        } finally {
            executor.shutdownNow();
        }
    }

    @Test
    void differentRacesMaintainIndependentSequences() {
        Long firstRaceId = persistRace("First race").raceId();
        Long secondRaceId = persistRace("Second race").raceId();

        assertEquals(1L, record(firstRaceId));
        assertEquals(2L, record(firstRaceId));
        assertEquals(1L, record(secondRaceId));

        assertEquals(2L, currentVersion(firstRaceId));
        assertEquals(1L, currentVersion(secondRaceId));
    }

    @Test
    void rollbackRemovesBusinessMutationVersionAndEventAndAllowsReuse() {
        PersistedRace persisted = persistRace("Original title");
        TransactionTemplate transactions = transactions();

        assertThrows(IllegalStateException.class, () -> transactions.executeWithoutResult(status -> {
            Race race = raceRepository.findById(persisted.raceId()).orElseThrow();
            race.setTitle("Rolled back title");
            eventService.record(
                    race,
                    RaceLiveEventType.PLAYER_PROGRESS_UPDATED,
                    new PlayerProgressUpdatedLiveEventPayload(List.of())
            );
            throw new IllegalStateException();
        }));

        Race rolledBack = transactions.execute(status ->
                raceRepository.findById(persisted.raceId()).orElseThrow()
        );
        assertEquals("Original title", rolledBack.getTitle());
        assertEquals(0L, rolledBack.getLiveEventVersion());
        assertEquals(0L, eventRepository.countByRaceId(persisted.raceId()));
        assertEquals(1L, record(persisted.raceId()));
    }

    @Test
    void orderedRepositoryRetrievalReturnsOnlyVersionsAfterCursor() {
        Long raceId = persistRace("Replay race").raceId();
        record(raceId);
        record(raceId);
        record(raceId);

        assertEquals(List.of(2L, 3L), eventVersionsAfter(raceId, 1L));
        assertEquals(List.of(), eventVersionsAfter(raceId, 3L));
    }

    @Test
    void durableWriterRejectsCallsWithoutAnExistingTransaction() {
        Race race = new Race();
        race.setId(999L);

        assertThrows(
                IllegalTransactionStateException.class,
                () -> eventService.record(
                        race,
                        RaceLiveEventType.PLAYER_PROGRESS_UPDATED,
                        new PlayerProgressUpdatedLiveEventPayload(List.of())
                )
        );
    }

    @Test
    void raceCursorHighestEventAndTeacherRecoveryCursorStayEqual() {
        PersistedRace persisted = persistRace("Recovery race");
        record(persisted.raceId());
        record(persisted.raceId());

        Race race = transactions().execute(status ->
                raceRepository.findById(persisted.raceId()).orElseThrow()
        );
        List<Long> versions = eventVersionsAfter(persisted.raceId(), 0L);
        TeacherRaceLiveStateResponse liveState = teacherLiveState(persisted, race);

        assertEquals(2L, versions.getLast());
        assertEquals(versions.getLast(), race.getLiveEventVersion());
        assertEquals(versions.getLast(), liveState.getEventVersion());
    }

    private Long recordAfterSignal(
            Long raceId,
            CountDownLatch ready,
            CountDownLatch start
    ) throws Exception {
        ready.countDown();
        start.await(10, TimeUnit.SECONDS);
        return record(raceId);
    }

    private Long record(Long raceId) {
        return transactions().execute(status -> {
            Race race = raceRepository.findById(raceId).orElseThrow();
            return eventService.record(
                    race,
                    RaceLiveEventType.PLAYER_PROGRESS_UPDATED,
                    new PlayerProgressUpdatedLiveEventPayload(List.of())
            ).version();
        });
    }

    private List<Long> eventVersionsAfter(Long raceId, Long afterVersion) {
        return eventRepository.findAfterVersionOrdered(raceId, afterVersion)
                .stream()
                .map(RaceLiveEvent::getVersion)
                .toList();
    }

    private Long currentVersion(Long raceId) {
        return transactions().execute(status ->
                raceRepository.findById(raceId).orElseThrow().getLiveEventVersion()
        );
    }

    private TeacherRaceLiveStateResponse teacherLiveState(
            PersistedRace persisted,
            Race race
    ) {
        CurrentUserService currentUserService = mock(CurrentUserService.class);
        UserService userService = mock(UserService.class);
        TeacherRaceLivePlayerSnapshotService snapshotService =
                mock(TeacherRaceLivePlayerSnapshotService.class);
        when(currentUserService.getCurrentUserId()).thenReturn(persisted.teacher().getId());
        when(userService.findActiveByIdOrThrow(persisted.teacher().getId()))
                .thenReturn(persisted.teacher());
        when(snapshotService.getOrderedPlayers(any())).thenReturn(List.of());
        TeacherRaceLiveStateService service = new TeacherRaceLiveStateService(
                currentUserService,
                userService,
                raceRepository,
                snapshotService,
                Clock.fixed(NOW, ZoneOffset.UTC)
        );

        return service.getLiveState(race.getId());
    }

    private PersistedRace persistRace(String title) {
        int sequence = TEST_SEQUENCE.incrementAndGet();
        return transactions().execute(status -> {
            User teacher = new User();
            teacher.setUsername("event-teacher-" + sequence);
            teacher.setDisplayName("Event Teacher");
            entityManager.persist(teacher);

            Subject subject = new Subject();
            subject.setName("Event Math " + sequence);
            subject.setCode("EVENT_MATH_" + sequence);
            entityManager.persist(subject);

            Race race = new Race();
            race.setRoomCode(String.format("E%05d", sequence));
            race.setTitle(title);
            race.setMaxPlayers(4);
            race.setTotalDistance(1000);
            race.setTeacher(teacher);
            race.setSubject(subject);
            entityManager.persist(race);
            entityManager.flush();
            return new PersistedRace(race.getId(), teacher);
        });
    }

    private TransactionTemplate transactions() {
        return new TransactionTemplate(transactionManager);
    }

    private record PersistedRace(Long raceId, User teacher) {
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
