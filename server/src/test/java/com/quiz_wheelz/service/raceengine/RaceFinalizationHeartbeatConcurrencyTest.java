package com.quiz_wheelz.service.raceengine;

import com.quiz_wheelz.dto.raceplayer.RacePlayerSessionIdentity;
import com.quiz_wheelz.entitys.Race;
import com.quiz_wheelz.entitys.RacePlayer;
import com.quiz_wheelz.entitys.Subject;
import com.quiz_wheelz.entitys.User;
import com.quiz_wheelz.enums.RacePlayerStatus;
import com.quiz_wheelz.enums.RaceStatus;
import com.quiz_wheelz.exception.ApiException;
import com.quiz_wheelz.exception.ErrorCode;
import com.quiz_wheelz.repository.RacePlayerRepository;
import com.quiz_wheelz.repository.RaceRepository;
import com.quiz_wheelz.service.raceplayer.CurrentRacePlayerService;
import com.quiz_wheelz.service.raceplayer.RacePlayerDisconnectService;
import com.quiz_wheelz.service.raceplayer.RacePlayerGameplayPresenceService;
import com.quiz_wheelz.service.raceplayer.RacePlayerHeartbeatService;
import com.quiz_wheelz.service.raceplayer.RacePlayerReconnectPolicy;
import com.quiz_wheelz.service.raceplayer.RacePlayerSessionLockService;
import com.quiz_wheelz.service.raceplayer.RedisPresenceService;
import jakarta.persistence.EntityManager;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.Optional;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@DataJpaTest
@ActiveProfiles("test")
@Transactional(propagation = Propagation.NOT_SUPPORTED)
class RaceFinalizationHeartbeatConcurrencyTest {

    private static final Instant NOW = Instant.parse("2026-08-23T08:00:00Z");
    private static final AtomicInteger SCENARIO_SEQUENCE = new AtomicInteger();

    @Autowired
    private EntityManager entityManager;

    @Autowired
    private RacePlayerRepository racePlayerRepository;

    @Autowired
    private RaceRepository raceRepository;

    @Autowired
    private PlatformTransactionManager transactionManager;

    private final ExecutorService executor = Executors.newFixedThreadPool(2);
    private final AtomicBoolean online = new AtomicBoolean(true);

    private TransactionTemplate transactions;
    private RedisPresenceService redisPresenceService;
    private RacePlayerGameplayTimelineService gameplayTimelineService;
    private RacePlayerHeartbeatService heartbeatService;
    private RaceMovementSettlementWorker settlementWorker;
    private HttpServletRequest request;
    private Long raceId;
    private Long racePlayerId;
    private int scenarioId;

    @BeforeEach
    void setUp() {
        transactions = new TransactionTemplate(transactionManager);
        scenarioId = SCENARIO_SEQUENCE.incrementAndGet();
        persistActiveRace();

        redisPresenceService = mock(RedisPresenceService.class);
        gameplayTimelineService = mock(RacePlayerGameplayTimelineService.class);
        CurrentRacePlayerService currentRacePlayerService =
                mock(CurrentRacePlayerService.class);
        request = mock(HttpServletRequest.class);
        Clock clock = Clock.fixed(NOW, ZoneOffset.UTC);
        RacePlayerReconnectPolicy reconnectPolicy = new RacePlayerReconnectPolicy();
        RacePlayerGameplayPresenceService presenceService =
                new RacePlayerGameplayPresenceService(
                        redisPresenceService,
                        racePlayerRepository,
                        reconnectPolicy,
                        clock
                );
        RacePlayerSessionLockService lockService = new RacePlayerSessionLockService(
                currentRacePlayerService,
                racePlayerRepository
        );
        RacePlayerDisconnectService disconnectService = new RacePlayerDisconnectService(
                racePlayerRepository,
                presenceService,
                gameplayTimelineService
        );
        heartbeatService = new RacePlayerHeartbeatService(
                lockService,
                racePlayerRepository,
                redisPresenceService,
                reconnectPolicy,
                presenceService,
                gameplayTimelineService,
                disconnectService,
                mock(com.quiz_wheelz.service.liveevent.RaceLiveEventChangeRecorder.class),
                mock(com.quiz_wheelz.service.liveevent.RaceLiveMutationGate.class),
                clock
        );
        settlementWorker = new RaceMovementSettlementWorker(
                racePlayerRepository,
                raceRepository,
                presenceService,
                gameplayTimelineService,
                new RaceFinishService(racePlayerRepository, clock),
                mock(com.quiz_wheelz.service.liveevent.RaceLiveEventChangeRecorder.class),
                mock(com.quiz_wheelz.service.liveevent.RaceLiveMutationGate.class),
                clock
        );

        RacePlayerSessionIdentity identity =
                new RacePlayerSessionIdentity(raceId, racePlayerId);
        when(currentRacePlayerService.resolveCurrentRacePlayerIdentity(request))
                .thenReturn(identity);
        when(redisPresenceService.isOnline(raceId, racePlayerId))
                .thenAnswer(invocation -> online.get());
        when(redisPresenceService.findLastGameplayActivityAt(raceId, racePlayerId))
                .thenReturn(Optional.of(NOW.minusSeconds(1)));
        when(redisPresenceService.tryAcquireLastSeenDbSyncGate(raceId, racePlayerId))
                .thenReturn(false);
        doAnswer(invocation -> {
            online.set(false);
            return null;
        }).when(redisPresenceService).markOffline(raceId, racePlayerId);
        doAnswer(invocation -> {
            RacePlayer racePlayer = invocation.getArgument(0);
            racePlayer.setStatus(RacePlayerStatus.DISCONNECTED);
            return true;
        }).when(gameplayTimelineService).settleForRaceFinalization(
                any(),
                any(),
                any()
        );
    }

    @AfterEach
    void tearDown() {
        executor.shutdownNow();
    }

    @Test
    void atomicHeartbeatRefreshWinsBeforeFinalizerChecksPresence() {
        when(redisPresenceService.renewExistingPresenceLease(
                raceId,
                racePlayerId,
                NOW
        )).thenReturn(true);

        inTransaction(() -> heartbeatService.heartbeat(request));
        inTransaction(() -> settlementWorker.finalizeRaceIfComplete(raceId));

        assertDurableState(RaceStatus.IN_PROGRESS, RacePlayerStatus.RACING);
        assertTrue(online.get());
    }

    @Test
    void finalizerCommitWinsWhenPresenceExpiresBeforeAtomicRefresh() throws Exception {
        CountDownLatch heartbeatReadPresence = new CountDownLatch(1);
        CountDownLatch finalizerCommitted = new CountDownLatch(1);
        when(redisPresenceService.findLastGameplayActivityAt(raceId, racePlayerId))
                .thenAnswer(invocation -> {
                    heartbeatReadPresence.countDown();
                    return Optional.of(NOW.minusSeconds(1));
                });
        when(redisPresenceService.renewExistingPresenceLease(
                raceId,
                racePlayerId,
                NOW
        )).thenAnswer(invocation -> {
            assertTrue(finalizerCommitted.await(5, TimeUnit.SECONDS));
            return online.get();
        });

        Future<?> heartbeat = executor.submit(
                () -> inTransaction(() -> heartbeatService.heartbeat(request))
        );
        assertTrue(heartbeatReadPresence.await(5, TimeUnit.SECONDS));
        online.set(false);

        try {
            inTransaction(() -> settlementWorker.finalizeRaceIfComplete(raceId));
        } finally {
            finalizerCommitted.countDown();
        }

        ExecutionException failure = assertThrows(ExecutionException.class, heartbeat::get);
        assertTrue(failure.getCause() instanceof ApiException);
        assertEquals(
                ErrorCode.RACE_PLAYER_RECONNECT_WINDOW_EXPIRED,
                ((ApiException) failure.getCause()).getErrorCode()
        );
        assertDurableState(RaceStatus.FINISHED, RacePlayerStatus.DISCONNECTED);
        assertEquals(false, online.get());
    }

    private void persistActiveRace() {
        transactions.executeWithoutResult(status -> {
            User teacher = new User();
            teacher.setUsername("concurrency-teacher-" + scenarioId);
            teacher.setDisplayName("Teacher");
            entityManager.persist(teacher);

            Subject subject = new Subject();
            subject.setName("Concurrency Math " + scenarioId);
            subject.setCode("CONCURRENCY_MATH_" + scenarioId);
            entityManager.persist(subject);

            Race race = new Race();
            race.setRoomCode(String.format("R%05d", scenarioId));
            race.setTitle("Concurrency race");
            race.setMaxPlayers(2);
            race.setTotalDistance(100);
            race.setTeacher(teacher);
            race.setSubject(subject);
            race.setStatus(RaceStatus.IN_PROGRESS);
            race.setStartedAt(LocalDateTime.ofInstant(NOW.minusSeconds(60), ZoneOffset.UTC));
            entityManager.persist(race);

            RacePlayer racePlayer = new RacePlayer();
            racePlayer.setRace(race);
            racePlayer.setDisplayName("Player");
            racePlayer.setLaneNumber(1);
            racePlayer.setStatus(RacePlayerStatus.RACING);
            racePlayer.setStartedAt(race.getStartedAt());
            racePlayer.setLastSeenAt(
                    LocalDateTime.ofInstant(NOW.minusSeconds(20), ZoneOffset.UTC)
            );
            entityManager.persist(racePlayer);
            entityManager.flush();
            raceId = race.getId();
            racePlayerId = racePlayer.getId();
        });
    }

    private void assertDurableState(
            RaceStatus expectedRaceStatus,
            RacePlayerStatus expectedPlayerStatus
    ) {
        transactions.executeWithoutResult(status -> {
            entityManager.clear();
            assertEquals(expectedRaceStatus, raceRepository.findById(raceId).orElseThrow().getStatus());
            assertEquals(
                    expectedPlayerStatus,
                    racePlayerRepository.findById(racePlayerId).orElseThrow().getStatus()
            );
        });
    }

    private void inTransaction(Runnable action) {
        transactions.executeWithoutResult(status -> action.run());
    }
}
