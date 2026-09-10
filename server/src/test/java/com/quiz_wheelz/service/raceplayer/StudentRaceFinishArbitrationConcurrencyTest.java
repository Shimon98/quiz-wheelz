package com.quiz_wheelz.service.raceplayer;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.quiz_wheelz.dto.raceplayer.RacePlayerSessionIdentity;
import com.quiz_wheelz.dto.raceplayer.StudentRaceFinishArbitrationResponse;
import com.quiz_wheelz.entitys.Race;
import com.quiz_wheelz.entitys.RaceLiveEvent;
import com.quiz_wheelz.entitys.RacePlayer;
import com.quiz_wheelz.entitys.Subject;
import com.quiz_wheelz.entitys.User;
import com.quiz_wheelz.enums.RaceLiveEventType;
import com.quiz_wheelz.enums.RacePlayerStatus;
import com.quiz_wheelz.enums.RaceStatus;
import com.quiz_wheelz.repository.RaceLiveEventRepository;
import com.quiz_wheelz.repository.RacePlayerRepository;
import com.quiz_wheelz.repository.RaceRepository;
import com.quiz_wheelz.service.liveevent.RaceLiveEventChangeRecorder;
import com.quiz_wheelz.service.liveevent.RaceLiveEventPayloadCodec;
import com.quiz_wheelz.service.liveevent.RaceLiveEventRecorder;
import com.quiz_wheelz.service.liveevent.RaceLiveEventService;
import com.quiz_wheelz.service.liveevent.RaceLiveMutationGate;
import com.quiz_wheelz.service.liveevent.RaceLiveMutationTracker;
import com.quiz_wheelz.service.question.QuestionTimeoutService;
import com.quiz_wheelz.service.raceengine.DifficultyProgressionService;
import com.quiz_wheelz.service.raceengine.RaceEngineService;
import com.quiz_wheelz.service.raceengine.RaceDecisionTimeService;
import com.quiz_wheelz.service.raceengine.RaceFinishOrderPolicy;
import com.quiz_wheelz.service.raceengine.RaceFinishService;
import com.quiz_wheelz.service.raceengine.RaceMovementCalculator;
import com.quiz_wheelz.service.raceengine.RaceMovementService;
import com.quiz_wheelz.service.raceengine.RaceMovementSettlementWorker;
import com.quiz_wheelz.service.raceengine.RacePlayerGameplayTimelineService;
import com.quiz_wheelz.service.raceengine.RaceProgressService;
import com.quiz_wheelz.service.raceengine.ScoringService;
import com.quiz_wheelz.service.teacher.TeacherRaceLivePlayerSnapshotService;
import jakarta.persistence.EntityManager;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@DataJpaTest
@ActiveProfiles("test")
@Transactional(propagation = Propagation.NOT_SUPPORTED)
@Import({
        StudentRaceFinishArbitrationService.class,
        RacePlayerSessionLockService.class,
        RacePlayerGameplayRequestGuard.class,
        RacePlayerGameplayPresenceService.class,
        RacePlayerReconnectPolicy.class,
        RacePlayerGameplayTimelineService.class,
        QuestionTimeoutService.class,
        RaceMovementService.class,
        RaceMovementCalculator.class,
        RaceFinishService.class,
        RaceEngineService.class,
        RaceDecisionTimeService.class,
        ScoringService.class,
        RaceProgressService.class,
        DifficultyProgressionService.class,
        RaceLiveEventChangeRecorder.class,
        RaceLiveEventRecorder.class,
        RaceLiveEventService.class,
        RaceLiveEventPayloadCodec.class,
        RaceLiveMutationGate.class,
        RaceLiveMutationTracker.class,
        TeacherRaceLivePlayerSnapshotService.class,
        RaceStandingCalculator.class,
        StudentRaceStandingService.class,
        StudentRaceRuntimeSnapshotMapper.class,
        RaceFinishOrderPolicy.class,
        RaceMovementSettlementWorker.class,
        StudentRaceFinishArbitrationConcurrencyTest.FixedTimeConfiguration.class
})
class StudentRaceFinishArbitrationConcurrencyTest {

    private static final Instant NOW = Instant.parse("2026-09-10T10:00:11Z");
    private static final long T = NOW.toEpochMilli();
    private static final long ANCHOR = T - 1_000;
    private static final AtomicInteger SEQUENCE = new AtomicInteger();

    @Autowired
    private StudentRaceFinishArbitrationService arbitrationService;

    @Autowired
    private RaceMovementSettlementWorker settlementWorker;

    @Autowired
    private RaceLiveMutationGate liveMutationGate;

    @Autowired
    private RacePlayerRepository racePlayerRepository;

    @Autowired
    private RaceRepository raceRepository;

    @Autowired
    private RaceLiveEventRepository eventRepository;

    @Autowired
    private PlatformTransactionManager transactionManager;

    @Autowired
    private EntityManager entityManager;

    @MockitoBean
    private RedisPresenceService redisPresenceService;

    @MockitoBean
    private CurrentRacePlayerService currentRacePlayerService;

    private final ExecutorService executor = Executors.newFixedThreadPool(3);
    private TransactionTemplate transactions;
    private Long raceId;
    private Long firstPlayerId;
    private Long secondPlayerId;

    @BeforeEach
    void setUp() {
        transactions = new TransactionTemplate(transactionManager);
        persistRace();
        when(redisPresenceService.isOnline(anyLong(), anyLong())).thenReturn(true);
        when(redisPresenceService.findLastGameplayActivityAt(anyLong(), anyLong()))
                .thenReturn(Optional.of(NOW.minusSeconds(1)));
    }

    @AfterEach
    void tearDown() {
        executor.shutdownNow();
    }

    @Test
    void concurrentArbitrationsAgreeOnOneFinishOrderAndEmitTerminalEventsOnce() throws Exception {
        HttpServletRequest first = requestFor(firstPlayerId);
        HttpServletRequest second = requestFor(secondPlayerId);
        CountDownLatch start = new CountDownLatch(1);

        Future<StudentRaceFinishArbitrationResponse> a = executor.submit(
                () -> afterSignal(start, () -> arbitrate(first))
        );
        Future<StudentRaceFinishArbitrationResponse> b = executor.submit(
                () -> afterSignal(start, () -> arbitrate(second))
        );
        start.countDown();
        StudentRaceFinishArbitrationResponse responseA = a.get(20, TimeUnit.SECONDS);
        StudentRaceFinishArbitrationResponse responseB = b.get(20, TimeUnit.SECONDS);

        assertEquals(T - 750, finishedAtOf(firstPlayerId));
        assertEquals(T - 500, finishedAtOf(secondPlayerId));
        StudentRaceFinishArbitrationResponse later = laterOf(responseA, responseB);
        StudentRaceFinishArbitrationResponse earlier = later == responseA ? responseB : responseA;
        assertEquals(List.of(firstPlayerId, secondPlayerId), confirmedIds(later));
        assertEquals(List.of(1, 2), confirmedRanks(later));
        assertEquals(3L, later.getFinishOrder().getEventVersion());
        assertTrue(confirmedIds(later).subList(0, confirmedIds(earlier).size()).equals(confirmedIds(earlier)));
        assertEquals(1, laterOf(responseA, responseB) == responseA ? responseA.getSnapshot().getRank() : responseB.getSnapshot().getOpponents().get(0).getRank());
        assertEquals(
                List.of(RaceLiveEventType.PLAYER_FINISHED, RaceLiveEventType.PLAYER_FINISHED, RaceLiveEventType.RACE_FINISHED),
                eventTypes()
        );
        assertEquals(RaceStatus.FINISHED, raceStatus());
    }

    private StudentRaceFinishArbitrationResponse laterOf(
            StudentRaceFinishArbitrationResponse a,
            StudentRaceFinishArbitrationResponse b
    ) {
        return a.getFinishOrder().getEventVersion() >= b.getFinishOrder().getEventVersion() ? a : b;
    }

    private List<Long> confirmedIds(StudentRaceFinishArbitrationResponse response) {
        return response.getFinishOrder().getConfirmedFinishers().stream()
                .map(com.quiz_wheelz.dto.raceplayer.StudentRaceConfirmedFinisherResponse::getRacePlayerId)
                .toList();
    }

    private List<Integer> confirmedRanks(StudentRaceFinishArbitrationResponse response) {
        return response.getFinishOrder().getConfirmedFinishers().stream()
                .map(com.quiz_wheelz.dto.raceplayer.StudentRaceConfirmedFinisherResponse::getRank)
                .toList();
    }

    @Test
    void arbitrationWaitsForASinglePlayerMutationHoldingPlayerThenRaceLocks() throws Exception {
        CountDownLatch locksHeld = new CountDownLatch(1);
        CountDownLatch release = new CountDownLatch(1);
        Future<?> mutation = executor.submit(() -> transactions.executeWithoutResult(status -> {
            RacePlayer player = racePlayerRepository
                    .findLockedByIdAndRaceId(secondPlayerId, raceId)
                    .orElseThrow();
            liveMutationGate.lockIfActive(player).orElseThrow();
            player.setPosition(999.0);
            player.setMovementUpdatedAtEpochMs(T);
            locksHeld.countDown();
            await(release);
        }));
        assertTrue(locksHeld.await(10, TimeUnit.SECONDS));

        Future<StudentRaceFinishArbitrationResponse> arbitration =
                executor.submit(() -> arbitrate(requestFor(firstPlayerId)));
        assertThrows(
                java.util.concurrent.TimeoutException.class,
                () -> arbitration.get(300, TimeUnit.MILLISECONDS)
        );
        release.countDown();
        mutation.get(10, TimeUnit.SECONDS);
        StudentRaceFinishArbitrationResponse response = arbitration.get(20, TimeUnit.SECONDS);

        assertEquals(999.0, response.getSnapshot().getOpponents().get(0).getPosition());
        assertEquals(T, response.getSnapshot().getOpponents().get(0).getPositionAtEpochMs());
        assertEquals(RacePlayerStatus.RACING, response.getSnapshot().getOpponents().get(0).getStatus());
        assertEquals(1, response.getFinishOrder().getConfirmedFinishers().size());
    }

    @Test
    void arbitrationAndFinalizerShareTheRosterLockOrderAndFinishTheRaceOnce() throws Exception {
        when(redisPresenceService.isOnline(anyLong(), anyLong())).thenReturn(false);
        when(redisPresenceService.findLastGameplayActivityAt(anyLong(), anyLong()))
                .thenReturn(Optional.of(NOW));
        CountDownLatch start = new CountDownLatch(1);

        Future<?> finalizer = executor.submit(() -> afterSignal(start, () -> {
            transactions.executeWithoutResult(status -> settlementWorker.finalizeRaceIfComplete(raceId));
            return null;
        }));
        Future<?> arbitration = executor.submit(() -> afterSignal(start, () -> {
            try {
                return arbitrate(requestFor(firstPlayerId));
            } catch (com.quiz_wheelz.exception.ApiException expected) {
                return null;
            }
        }));
        start.countDown();
        finalizer.get(20, TimeUnit.SECONDS);
        arbitration.get(20, TimeUnit.SECONDS);

        assertEquals(RaceStatus.FINISHED, raceStatus());
        assertEquals(1, eventTypes().stream().filter(RaceLiveEventType.RACE_FINISHED::equals).count());
    }

    @Test
    void rollbackRemovesFinishStateEventsAndVersionTogether() {
        assertThrows(IllegalStateException.class, () -> transactions.executeWithoutResult(status -> {
            arbitrationService.arbitrate(requestFor(firstPlayerId));
            throw new IllegalStateException();
        }));

        assertEquals(RaceStatus.IN_PROGRESS, raceStatus());
        assertEquals(RacePlayerStatus.RACING, transactions.execute(status ->
                racePlayerRepository.findById(firstPlayerId).orElseThrow().getStatus()));
        Long version = transactions.execute(status ->
                raceRepository.findById(raceId).orElseThrow().getLiveEventVersion());
        assertEquals(0L, version);
        assertNull(transactions.execute(status -> raceRepository.findById(raceId)
                .orElseThrow().getAuthoritativeDecisionTimeFloorEpochMs()));
        assertTrue(eventTypes().isEmpty());
    }

    private StudentRaceFinishArbitrationResponse arbitrate(HttpServletRequest request) {
        return transactions.execute(status -> arbitrationService.arbitrate(request));
    }

    private <T> T afterSignal(CountDownLatch start, java.util.concurrent.Callable<T> action) throws Exception {
        assertTrue(start.await(10, TimeUnit.SECONDS));
        return action.call();
    }

    private HttpServletRequest requestFor(Long racePlayerId) {
        HttpServletRequest request = mock(HttpServletRequest.class);
        when(currentRacePlayerService.resolveCurrentRacePlayerIdentity(request))
                .thenReturn(new RacePlayerSessionIdentity(raceId, racePlayerId));
        return request;
    }

    private long finishedAtOf(Long racePlayerId) {
        return transactions.execute(status ->
                racePlayerRepository.findById(racePlayerId).orElseThrow().getFinishedAtEpochMs());
    }

    private RaceStatus raceStatus() {
        return transactions.execute(status -> raceRepository.findById(raceId).orElseThrow().getStatus());
    }

    private List<RaceLiveEventType> eventTypes() {
        return transactions.execute(status -> eventRepository
                .findAfterVersionOrdered(raceId, 0L, PageRequest.of(0, 100))
                .stream()
                .map(RaceLiveEvent::getType)
                .toList());
    }

    private void await(CountDownLatch latch) {
        try {
            assertTrue(latch.await(10, TimeUnit.SECONDS));
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException(exception);
        }
    }

    private void persistRace() {
        int sequence = SEQUENCE.incrementAndGet();
        transactions.executeWithoutResult(status -> {
            User teacher = new User();
            teacher.setUsername("arbitration-teacher-" + sequence);
            teacher.setDisplayName("Teacher");
            entityManager.persist(teacher);

            Subject subject = new Subject();
            subject.setName("Arbitration Math " + sequence);
            subject.setCode("ARBITRATION_MATH_" + sequence);
            entityManager.persist(subject);

            Race race = new Race();
            race.setRoomCode(String.format("A%05d", sequence));
            race.setTitle("Photo finish");
            race.setMaxPlayers(2);
            race.setTotalDistance(1000);
            race.setTeacher(teacher);
            race.setSubject(subject);
            race.setStatus(RaceStatus.IN_PROGRESS);
            race.setStartedAt(LocalDateTime.ofInstant(NOW.minusSeconds(60), ZoneOffset.UTC));
            entityManager.persist(race);

            RacePlayer first = racingPlayer(race, "Noa", 1, 998.0);
            RacePlayer second = racingPlayer(race, "Amit", 2, 996.0);
            entityManager.persist(first);
            entityManager.persist(second);
            entityManager.flush();
            raceId = race.getId();
            firstPlayerId = first.getId();
            secondPlayerId = second.getId();
        });
    }

    private RacePlayer racingPlayer(Race race, String name, int lane, double position) {
        RacePlayer racePlayer = new RacePlayer();
        racePlayer.setRace(race);
        racePlayer.setDisplayName(name);
        racePlayer.setLaneNumber(lane);
        racePlayer.setStatus(RacePlayerStatus.RACING);
        racePlayer.setPosition(position);
        racePlayer.setSpeed(2.0);
        racePlayer.setMovementUpdatedAtEpochMs(ANCHOR);
        racePlayer.setStartedAt(race.getStartedAt());
        racePlayer.setLastSeenAt(LocalDateTime.ofInstant(NOW.minusSeconds(1), ZoneOffset.UTC));
        return racePlayer;
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

        @Bean
        ZoneId applicationZoneId() {
            return ZoneOffset.UTC;
        }
    }
}
