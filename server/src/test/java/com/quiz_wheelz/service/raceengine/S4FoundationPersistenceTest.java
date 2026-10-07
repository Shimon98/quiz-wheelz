package com.quiz_wheelz.service.raceengine;

import com.quiz_wheelz.dto.raceplayer.RacePlayerJoinRequest;
import com.quiz_wheelz.entitys.*;
import com.quiz_wheelz.enums.*;
import com.quiz_wheelz.exception.ApiException;
import com.quiz_wheelz.exception.ErrorCode;
import com.quiz_wheelz.repository.*;
import com.quiz_wheelz.service.auth.JwtService;
import com.quiz_wheelz.service.liveevent.RaceLiveEventRecorder;
import com.quiz_wheelz.service.raceplayer.RacePlayerGameplayStateService;
import com.quiz_wheelz.service.raceplayer.RacePlayerJoinService;
import jakarta.persistence.EntityManager;
import jakarta.persistence.LockModeType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.transaction.IllegalTransactionStateException;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.LocalDateTime;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@DataJpaTest(showSql = false)
@ActiveProfiles("test")
@Transactional(propagation = Propagation.NOT_SUPPORTED)
@Import({com.quiz_wheelz.service.challenge.ChallengeOfferService.class, com.quiz_wheelz.service.challenge.ChallengeEnergyService.class, com.quiz_wheelz.service.challenge.ChallengeEligibilityService.class, com.quiz_wheelz.service.challenge.StudentChallengeProjectionService.class,
RacePlayerGameplayStateService.class, RacePlayerSpeedEffectService.class, RacePlayerJoinService.class,
        RaceSpeedEffectMovementCalculator.class, RaceMovementCalculator.class,
        com.quiz_wheelz.service.raceplayer.StudentRaceGameplayProjectionService.class,
        com.quiz_wheelz.service.raceplayer.StudentRaceRuntimeSnapshotMapper.class,
        com.quiz_wheelz.service.raceplayer.StudentRaceRuntimeSnapshotService.class})
class S4FoundationPersistenceTest {

    private static final AtomicInteger SEQUENCE = new AtomicInteger();

    @Autowired EntityManager entityManager;
    @Autowired PlatformTransactionManager transactionManager;
    @Autowired RacePlayerGameplayStateRepository states;
    @Autowired RacePlayerSpeedEffectRepository effects;
    @Autowired RacePlayerRepository players;
    @Autowired RacePlayerGameplayStateService stateService;
    @Autowired RacePlayerSpeedEffectService effectService;
    @Autowired RacePlayerJoinService joinService;
    @Autowired com.quiz_wheelz.service.raceplayer.StudentRaceRuntimeSnapshotService snapshots;
    @MockitoBean JwtService jwtService;
    @MockitoBean RaceLiveEventRecorder events;

    private TransactionTemplate transactions;
    private Long raceId;
    private String roomCode;

    @BeforeEach
    void prepareRace() {
        transactions = new TransactionTemplate(transactionManager);
        roomCode = String.format("S%05d", SEQUENCE.incrementAndGet());
        raceId = transactions.execute(status -> {
            User teacher = new User();
            teacher.setUsername("s4-" + roomCode);
            teacher.setDisplayName("Teacher");
            entityManager.persist(teacher);
            Subject subject = new Subject();
            subject.setName("Math " + roomCode);
            subject.setCode(roomCode);
            entityManager.persist(subject);
            Race race = new Race();
            race.setTeacher(teacher);
            race.setSubject(subject);
            race.setRoomCode(roomCode);
            race.setTitle("S4 race");
            race.setMaxPlayers(4);
            race.setTotalDistance(1000);
            entityManager.persist(race);
            return race.getId();
        });
    }

    @Test
    void joiningCreatesExactlyOneZeroEnergyState() {
        when(jwtService.createRacePlayerToken(anyLong(), anyLong(), anyString())).thenReturn("token");
        Long id = joinService.joinRace(request()).getResponse().getPlayer().getPlayerId();
        transactions.executeWithoutResult(status -> {
            RacePlayerGameplayState state = states.findByRacePlayerId(id).orElseThrow();
            assertEquals(0, state.getChallengeEnergy());
            assertEquals(1L, entityManager.createQuery(
                    "select count(s) from RacePlayerGameplayState s where s.racePlayer.id = :id", Long.class)
                    .setParameter("id", id).getSingleResult());
        });
    }

    @Test
    void stateConstraintFailureRollsBackParticipantAndStateInJoinTransaction() {
        when(jwtService.createRacePlayerToken(anyLong(), anyLong(), anyString())).thenAnswer(call -> {
            RacePlayerGameplayState state = states.findByRacePlayerId(call.getArgument(1)).orElseThrow();
            state.setChallengeEnergy(-1);
            entityManager.flush();
            return "unreachable";
        });
        assertThrows(RuntimeException.class, () -> joinService.joinRace(request()));
        transactions.executeWithoutResult(status -> {
            assertEquals(0L, entityManager.createQuery(
                    "select count(p) from RacePlayer p where p.race.id = :id", Long.class)
                    .setParameter("id", raceId).getSingleResult());
            assertEquals(0L, entityManager.createQuery(
                    "select count(s) from RacePlayerGameplayState s where s.racePlayer.race.id = :id", Long.class)
                    .setParameter("id", raceId).getSingleResult());
        });
    }

    @Test
    void lockedLegacyPlayerCreatesOnceAndRetrievesSameState() {
        Long id = legacyPlayer();
        Long stateId = transactions.execute(status -> {
            RacePlayer player = locked(id);
            RacePlayerGameplayState first = stateService.obtainForLockedPlayer(player);
            assertEquals(0, first.getChallengeEnergy());
            assertSame(first, stateService.obtainForLockedPlayer(player));
            return first.getId();
        });
        transactions.executeWithoutResult(status ->
                assertEquals(stateId, stateService.obtainForLockedPlayer(locked(id)).getId()));
    }

    @Test
    void duplicateGameplayStateIsRejectedByDatabase() {
        Long id = legacyPlayer();
        assertThrows(RuntimeException.class, () -> transactions.executeWithoutResult(status -> {
            RacePlayer player = locked(id);
            stateService.createInitialState(player);
            stateService.createInitialState(player);
            entityManager.flush();
        }));
    }

    @Test
    void concurrentLegacyAccessUnderPlayerLockCreatesOneState() throws Exception {
        Long id = legacyPlayer();
        CountDownLatch ready = new CountDownLatch(2);
        CountDownLatch start = new CountDownLatch(1);
        try (var executor = Executors.newFixedThreadPool(2)) {
            var first = executor.submit(() -> obtainAfterSignal(id, ready, start));
            var second = executor.submit(() -> obtainAfterSignal(id, ready, start));
            assertTrue(ready.await(10, TimeUnit.SECONDS));
            start.countDown();
            assertEquals(first.get(10, TimeUnit.SECONDS), second.get(10, TimeUnit.SECONDS));
        }
    }

    private Long obtainAfterSignal(Long id, CountDownLatch ready, CountDownLatch start) throws Exception {
        ready.countDown();
        assertTrue(start.await(10, TimeUnit.SECONDS));
        return transactions.execute(status -> stateService.obtainForLockedPlayer(locked(id)).getId());
    }

    @Test
    void stateAndEffectMutationsRequireCallerTransaction() {
        RacePlayer player = new RacePlayer();
        player.setId(1L);
        assertThrows(IllegalTransactionStateException.class, () -> stateService.obtainForLockedPlayer(player));
        assertThrows(IllegalTransactionStateException.class, () ->
                effectService.createSlowdownForLockedPlayer(player, EffectSource.CHALLENGE_TIMEOUT, 1, 0, 10));
    }

    @Test
    void persistedSlowdownsUseOrderedHalfOpenWindowsWithoutExpiryMutation() {
        Long id = legacyPlayer();
        transactions.executeWithoutResult(status -> {
            RacePlayer player = locked(id);
            RacePlayerSpeedEffect later = create(player, 200, 300);
            RacePlayerSpeedEffect earlier = create(player, 100, 200);
            entityManager.flush();
            entityManager.clear();
            assertEquals(List.of(earlier.getId(), later.getId()),
                    effects.findOverlapping(id, 50, 350).stream().map(RacePlayerSpeedEffect::getId).toList());
            assertEquals(List.of(later.getId()),
                    effects.findOverlapping(id, 200, 300).stream().map(RacePlayerSpeedEffect::getId).toList());
            assertTrue(effects.findOverlapping(id, 300, 400).isEmpty());
            assertEquals(EffectType.SPEED_SLOW, effects.findById(earlier.getId()).orElseThrow().getType());
            assertEquals(EffectSource.CHALLENGE_TIMEOUT, later.getSource());
            assertEquals(1, later.getMagnitudeTenths());
        });
    }

    @Test
    void realDatabaseEffectsFeedLocalSnapshotAndBatchQueryInDeterministicPlayerOrder() {
        Long firstId = legacyPlayer();
        Long secondId = legacyPlayer();
        transactions.executeWithoutResult(status -> {
            RacePlayer first = locked(firstId);
            RacePlayer second = locked(secondId);
            first.getRace().setStatus(RaceStatus.IN_PROGRESS);
            first.setStatus(RacePlayerStatus.RACING);
            first.setSpeed(1.3);
            var later = create(first, 200, 300);
            var earlier = create(first, 100, 200);
            var other = create(second, 100, 300);
            entityManager.flush();
            entityManager.clear();
            assertEquals(List.of(earlier.getId(), later.getId(), other.getId()),
                    effects.findRelevantForPlayers(List.of(secondId, firstId), 100, 300)
                            .stream().map(RacePlayerSpeedEffect::getId).toList());
            var grouped = effectService.findRelevantForPlayers(List.of(firstId, secondId), 200, 200);
            assertEquals(List.of(later.getId()), grouped.get(firstId).stream()
                    .map(RacePlayerSpeedEffect::getId).toList());
            var snapshot = snapshots.fromRacePlayer(locked(firstId),
                    new com.quiz_wheelz.service.raceplayer.StudentRaceStandingResult(1, 2, List.of()), 200, 0);
            assertEquals(1.3, snapshot.getSpeed());
            assertEquals(1.2, snapshot.getGameplay().effectiveSpeed());
            assertEquals(4.8, snapshot.getMovementUnitsPerSecond());
            assertEquals(later.getId(), snapshot.getGameplay().activeEffects().getFirst().effectId());
            assertTrue(snapshots.fromRacePlayer(locked(firstId),
                    new com.quiz_wheelz.service.raceplayer.StudentRaceStandingResult(1, 2, List.of()), 300, 0)
                    .getGameplay().activeEffects().isEmpty());
        });
    }

    @Test
    void overlappingIntervalsAreRejectedButAdjacentAndOtherPlayersAreAllowed() {
        Long id = legacyPlayer();
        Long otherId = legacyPlayer();
        transactions.executeWithoutResult(status -> create(locked(id), 100, 200));
        for (long[] interval : new long[][]{{100, 200}, {90, 110}, {190, 210}, {110, 190}, {90, 210}}) {
            ApiException exception = assertThrows(ApiException.class, () -> transactions.executeWithoutResult(
                    status -> create(locked(id), interval[0], interval[1])));
            assertEquals(ErrorCode.SPEED_EFFECT_OVERLAP, exception.getErrorCode());
        }
        transactions.executeWithoutResult(status -> {
            create(locked(id), 0, 100);
            create(locked(id), 200, 300);
            create(locked(otherId), 100, 200);
        });
    }

    @Test
    void invalidIntervalsAndMagnitudesAreRejected() {
        Long id = legacyPlayer();
        for (int magnitude : new int[]{0, -1}) {
            assertInvalid(() -> transactions.executeWithoutResult(status ->
                    effectService.createSlowdownForLockedPlayer(
                            locked(id), EffectSource.CHALLENGE_TIMEOUT, magnitude, 0, 10)));
        }
        assertInvalid(() -> transactions.executeWithoutResult(status -> create(locked(id), 10, 10)));
        assertInvalid(() -> transactions.executeWithoutResult(status -> create(locked(id), 11, 10)));
        assertInvalid(() -> transactions.executeWithoutResult(status ->
                effectService.createSlowdownForLockedPlayer(locked(id), null, 1, 0, 10)));
    }

    @Test
    void questionContextDefaultsToNormalAndPersistsFutureContextsInternally() {
        Long id = legacyPlayer();
        transactions.executeWithoutResult(status -> {
            QuestionTemplate template = new QuestionTemplate();
            template.setSubject(entityManager.find(Race.class, raceId).getSubject());
            template.setType(QuestionType.ADDITION);
            template.setDifficulty(Difficulty.EASY);
            template.setMinValue(0);
            template.setMaxValue(10);
            template.setTimeLimitSeconds(30);
            template.setChoicesCount(4);
            entityManager.persist(template);
            for (QuestionGameplayContext context : QuestionGameplayContext.values()) {
                PlayerQuestion question = new PlayerQuestion();
                assertEquals(QuestionGameplayContext.NORMAL, question.getGameplayContext());
                question.setRacePlayer(locked(id));
                question.setQuestionTemplate(template);
                question.setQuestionText("1 + 1");
                question.setCorrectAnswerValue(2);
                question.setTimeLimitSeconds(30);
                question.setExpiresAt(LocalDateTime.now().plusSeconds(30));
                question.setGameplayContext(context);
                entityManager.persist(question);
                entityManager.flush();
                Long questionId = question.getId();
                entityManager.clear();
                assertEquals(context, entityManager.find(PlayerQuestion.class, questionId).getGameplayContext());
                entityManager.createNativeQuery(
                        "update player_questions set gameplay_context = DEFAULT where id = :id")
                        .setParameter("id", questionId).executeUpdate();
                entityManager.clear();
                assertEquals(QuestionGameplayContext.NORMAL,
                        entityManager.find(PlayerQuestion.class, questionId).getGameplayContext());
                template = entityManager.find(QuestionTemplate.class, template.getId());
            }
        });
    }

    @Test
    void questionContextDeclaresNonNullNormalDevBackfillDefault() throws Exception {
        var field = PlayerQuestion.class.getDeclaredField("gameplayContext");
        assertFalse(field.getAnnotation(jakarta.persistence.Column.class).nullable());
        assertEquals("'NORMAL'", field.getAnnotation(org.hibernate.annotations.ColumnDefault.class).value());
    }

    private void assertInvalid(Runnable action) {
        assertEquals(ErrorCode.SPEED_EFFECT_INVALID, assertThrows(ApiException.class, action::run).getErrorCode());
    }

    private RacePlayerSpeedEffect create(RacePlayer player, long start, long end) {
        return effectService.createSlowdownForLockedPlayer(player, EffectSource.CHALLENGE_TIMEOUT, 1, start, end);
    }

    private RacePlayer locked(Long id) {
        return entityManager.find(RacePlayer.class, id, LockModeType.PESSIMISTIC_WRITE);
    }

    private Long legacyPlayer() {
        return transactions.execute(status -> {
            Race race = entityManager.find(Race.class, raceId, LockModeType.PESSIMISTIC_WRITE);
            int lane = (int) players.countByRace(race) + 1;
            RacePlayer player = new RacePlayer();
            player.setRace(race);
            player.setDisplayName("Legacy " + lane);
            player.setLaneNumber(lane);
            entityManager.persist(player);
            return player.getId();
        });
    }

    private RacePlayerJoinRequest request() {
        RacePlayerJoinRequest request = new RacePlayerJoinRequest();
        request.setRoomCode(roomCode);
        request.setDisplayName("Noa");
        return request;
    }
}
