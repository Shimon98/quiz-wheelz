package com.quiz_wheelz.service.raceplayer;

import com.quiz_wheelz.config.ConfigPropertyKeys;
import com.quiz_wheelz.dto.raceplayer.RacePlayerFocusEventRequest;
import com.quiz_wheelz.entitys.*;
import com.quiz_wheelz.enums.*;
import com.quiz_wheelz.exception.ApiException;
import com.quiz_wheelz.repository.RacePlayerRecoveryStateRepository;
import com.quiz_wheelz.service.recovery.HiddenRecoveryService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoSpyBean;

import java.util.List;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.function.Consumer;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.clearInvocations;
import static org.mockito.Mockito.mockingDetails;

@TestPropertySource(properties = ConfigPropertyKeys.QUIZWHEELZ_RECOVERY_ENABLED + "=true")
@Import({HiddenRecoveryService.class, RacePlayerFocusEventService.class})
class HiddenRecoveryIntegrationTest extends S4ChallengeFlowFixture {
    // Oldest first, newest in bit 0: C, W, W, C, W, C.
    static final int QUALIFYING_WINDOW = 0b100101;

    @MockitoSpyBean RacePlayerRecoveryStateRepository recoveryStates;
    @Autowired HiddenRecoveryService recovery;
    @Autowired StudentRaceStandingService standings;
    @Autowired RacePlayerFocusEventService focus;
    @MockitoSpyBean StudentRaceStandingProjectionService projections;

    @BeforeEach
    void farBehindAmongRacingClassmates() {
        secondPosition(300.0);
        transactions.executeWithoutResult(status -> {
            var race = raceRepository.findById(raceId).orElseThrow();
            entityManager.persist(player(race, "Leader", 3, 480.0));
            entityManager.persist(player(race, "Middle", 4, 400.0));
        });
    }

    @Test
    void aStrugglingStudentFarBehindGetsTenEnergyOnceOnTheQualifyingCorrectAnswer() {
        answerFiveMixedOutcomes();

        answer(true);

        assertEquals(70, energy());
        var state = recoveryState();
        assertEquals(QUALIFYING_WINDOW, state.getRecentOutcomeBits());
        assertEquals(6, state.getRecentOutcomeCount());
        assertEquals(state.getLastObservedNormalQuestionId(), state.getAwardedQuestionId());
        assertEquals(10, state.getAwardedEnergy());
        assertEquals(T, state.getAwardedAtEpochMs());
        answer(false);
        answer(true);
        assertEquals(90, energy());
        assertEquals(10, recoveryState().getAwardedEnergy());
    }

    @Test
    void wrongAnswersAndPenalizedTimeoutsCountButAnExpiryWithoutConsequenceDoesNot() {
        answerSecond();
        answer(false);
        current();
        expireActiveQuestion();
        snapshot();
        current();
        transactions.executeWithoutResult(status -> timeline.expireActiveQuestionForTerminalPlayer(locked()));

        var state = recoveryState();
        assertEquals(0b100, state.getRecentOutcomeBits());
        assertEquals(3, state.getRecentOutcomeCount());
        assertNull(state.getAwardedQuestionId());
        assertEquals(20, energy());
    }

    @Test
    void theNudgeThatFillsTheMeterOpensTheOfferWithTheSameAnswer() {
        answerFiveMixedOutcomes();
        energy(70);

        var snapshot = answer(true).getRaceImpact().getSnapshot();

        assertNotNull(snapshot.getGameplay().challenge().offer());
        assertEquals(0, energy());
        assertEquals(10, recoveryState().getAwardedEnergy());
    }

    @Test
    void aMeterWithoutRoomForAllTenKeepsTheOneTimeRightForLater() {
        answerFiveMixedOutcomes();
        energy(71);
        answer(true);
        assertEquals(91, energy());
        assertNull(recoveryState().getAwardedQuestionId());

        energy(30);
        answer(false);
        answer(true);

        assertEquals(60, energy());
        assertEquals(10, recoveryState().getAwardedEnergy());
    }

    @Test
    void aStudentCloseToTheOthersGetsNothing() {
        transactions.executeWithoutResult(status -> playerRepository.findByRaceAndStatusOrderByLaneNumberAsc(
                raceRepository.findById(raceId).orElseThrow(), RacePlayerStatus.RACING).stream()
                .filter(player -> !player.getId().equals(secondId))
                .forEach(player -> player.setPosition(345.0)));
        answerFiveMixedOutcomes();

        answer(true);

        assertEquals(60, energy());
        assertNull(recoveryState().getAwardedQuestionId());
    }

    @Test
    void aStudentWhoIsTheOnlyRacerLeftGetsNothing() {
        transactions.executeWithoutResult(status -> playerRepository.findByRaceAndStatusOrderByLaneNumberAsc(
                raceRepository.findById(raceId).orElseThrow(), RacePlayerStatus.RACING).stream()
                .filter(player -> !player.getId().equals(secondId))
                .forEach(player -> player.setStatus(RacePlayerStatus.DISCONNECTED)));
        answerFiveMixedOutcomes();

        answer(true);

        assertEquals(60, energy());
        assertNull(recoveryState().getAwardedQuestionId());
    }

    @Test
    void theGrantChangesOnlyEnergyAndARollbackUndoesItTogetherWithTheAward() {
        seedQualifyingWindow();
        energy(50);
        var before = learningAndMovement();

        transactions.executeWithoutResult(status -> {
            var player = locked();
            var gameplay = stateService.obtainForLockedPlayer(player);
            assertTrue(recovery.nudgeAfterNormalGain(player, questionRepository.findById(questionId).orElseThrow(),
                    recoveryState(), gameplay, T, standings.calculate(player, T)));
            assertEquals(60, gameplay.getChallengeEnergy());
            status.setRollbackOnly();
        });

        assertEquals(50, energy());
        assertNull(recoveryState().getAwardedQuestionId());
        assertEquals(before, learningAndMovement());
        transactions.executeWithoutResult(status -> {
            var player = locked();
            recovery.nudgeAfterNormalGain(player, questionRepository.findById(questionId).orElseThrow(),
                    recoveryState(), stateService.obtainForLockedPlayer(player), T, standings.calculate(player, T));
        });
        assertEquals(60, energy());
        assertEquals(before, learningAndMovement());
    }

    @Test
    void withoutStandingsThereIsNoGrantAndTheRightIsKept() {
        seedQualifyingWindow();
        energy(50);

        transactions.executeWithoutResult(status -> {
            var player = locked();
            assertFalse(recovery.nudgeAfterNormalGain(player, questionRepository.findById(questionId).orElseThrow(),
                    recoveryState(), stateService.obtainForLockedPlayer(player), T, null));
        });

        assertEquals(50, energy());
        assertNull(recoveryState().getAwardedQuestionId());
    }

    // Review M2: like ChallengeEnergyService.earn, the grant checks the lifecycle itself, so no caller can grant once the
    // student or the race is done.
    @Test
    void theGrantItselfRefusesAStudentOrARaceThatIsDone() {
        seedQualifyingWindow();
        energy(50);
        List<Consumer<RacePlayer>> endings = List.of(player -> player.setStatus(RacePlayerStatus.FINISHED),
                player -> player.getRace().setStatus(RaceStatus.FINISHED),
                player -> player.getRace().setStatus(RaceStatus.CANCELLED));

        for (var ending : endings) {
            transactions.executeWithoutResult(status -> {
                var player = locked();
                ending.accept(player);
                assertFalse(recovery.nudgeAfterNormalGain(player, questionRepository.findById(questionId).orElseThrow(),
                        recoveryState(), stateService.obtainForLockedPlayer(player), T, standings.calculate(player, T)));
                status.setRollbackOnly();
            });
        }

        assertEquals(50, energy());
        assertNull(recoveryState().getAwardedQuestionId());
    }

    @Test
    void aQualifyingAnswerProjectsTheStandingsNoMoreOftenThanAnOrdinaryOne() {
        answerSecond();
        answer(false);
        answer(false);
        long ordinary = projectionsDuring(() -> answer(true));
        answer(false);

        long qualifying = projectionsDuring(() -> answer(true));

        assertEquals(10, recoveryState().getAwardedEnergy());
        assertEquals(ordinary, qualifying);
    }

    // Review M3 (2026-11-08): each NORMAL outcome reads the student's Recovery row once, the granting answer included.
    @Test
    void eachNormalOutcomeReadsTheRecoveryRowOnce() {
        answerSecond();
        assertEquals(1, recoveryReadsDuring(() -> answer(false)));
        current();
        expireActiveQuestion();
        assertEquals(1, recoveryReadsDuring(() -> {
            snapshot();
            current();
        }));
        assertEquals(1, recoveryReadsDuring(() -> answer(true)));
        answer(false);

        assertEquals(1, recoveryReadsDuring(() -> answer(true)));

        assertEquals(70, energy());
        assertEquals(10, recoveryState().getAwardedEnergy());
    }

    @Test
    void aChallengeAnswerNeverEntersTheWindow() {
        select(ChallengeChoice.TURBO_TRIAL);
        var before = recoveryState();

        answer(false);

        var after = recoveryState();
        assertEquals(before.getRecentOutcomeBits(), after.getRecentOutcomeBits());
        assertEquals(before.getRecentOutcomeCount(), after.getRecentOutcomeCount());
        assertEquals(before.getLastObservedNormalQuestionId(), after.getLastObservedNormalQuestionId());
    }

    @Test
    void anOverdueAnswerKeepsItsPenalizedTimeoutInTheWindowAlthoughItEndsWithQuestionExpired() {
        answerSecond();
        var question = current();
        expireActiveQuestion();

        var rejection = assertThrows(ApiException.class, () -> answerCorrectly(question.getQuestionId()));

        assertEquals(com.quiz_wheelz.exception.ErrorCode.QUESTION_EXPIRED, rejection.getErrorCode());
        var state = recoveryState();
        assertEquals(0b10, state.getRecentOutcomeBits());
        assertEquals(2, state.getRecentOutcomeCount());
        assertEquals(question.getQuestionId(), state.getLastObservedNormalQuestionId());
    }

    // Product rule approved by Shimon on 2026-11-04 (Diana reviews it in the PR): a STRICT focus forfeit is the penalized
    // timeout of that NORMAL question, so it enters the window once, as one failure, and later focus events add nothing.
    @Test
    void aStrictFocusForfeitCountsAsOneFailureInTheWindow() {
        transactions.executeWithoutResult(status -> raceRepository.findById(raceId).orElseThrow()
                .setFocusPolicy(RaceFocusPolicy.STRICT));
        answerSecond();
        var question = current();

        for (int index = 0; index < 4; index++) {
            focus.recordFocusEvent(secondRequest, focusEvent(RacePlayerFocusEventType.TAB_HIDDEN));
            focus.recordFocusEvent(secondRequest, focusEvent(RacePlayerFocusEventType.TAB_VISIBLE));
        }

        assertEquals(PlayerQuestionStatus.EXPIRED, transactions.execute(status -> questionRepository
                .findById(question.getQuestionId()).orElseThrow().getStatus()));
        var state = recoveryState();
        assertEquals(0b10, state.getRecentOutcomeBits());
        assertEquals(2, state.getRecentOutcomeCount());
        assertEquals(question.getQuestionId(), state.getLastObservedNormalQuestionId());
    }

    // S4-06: the grant is never a public moment, and nothing about Recovery reaches the teacher's event stream.
    @Test
    void theGrantIsNeverAPublicMoment() {
        answerFiveMixedOutcomes();

        answer(true);

        assertEquals(10, recoveryState().getAwardedEnergy());
        assertEquals(List.of(), answeredMoments().getLast());
        assertTrue(answeredPayloadJson().stream().noneMatch(json -> json.toLowerCase().contains("recover")));
    }

    @Test
    void aFinishedLeaderIsNotPartOfTheField() {
        transactions.executeWithoutResult(status -> playerRepository.findByRaceOrderByLaneNumberAsc(
                        raceRepository.findById(raceId).orElseThrow()).stream()
                .filter(player -> "Leader".equals(player.getDisplayName()))
                .forEach(player -> {
                    player.setStatus(RacePlayerStatus.FINISHED);
                    player.setPosition(1000.0);
                }));
        answerFiveMixedOutcomes();

        answer(true);

        assertEquals(60, energy());
        assertNull(recoveryState().getAwardedQuestionId());
    }

    // Review 2026-11-08: a leader over the line stays RACING until the finish sweep or arbitration settles it (up to a
    // few seconds), and the projection puts it at the full distance. Shimon's 2026-11-04 rule leaves it out already.
    @Test
    void aLeaderOverTheLineIsNotPartOfTheFieldBeforeItIsMarkedFinished() {
        transactions.executeWithoutResult(status -> playerRepository.findByRaceOrderByLaneNumberAsc(
                        raceRepository.findById(raceId).orElseThrow()).stream()
                .filter(player -> "Leader".equals(player.getDisplayName()))
                .forEach(player -> player.setPosition(1000.0)));
        answerFiveMixedOutcomes();

        answer(true);

        assertEquals(60, energy());
        assertNull(recoveryState().getAwardedQuestionId());
    }

    @Test
    void afterTheGrantLaterAnswersWriteNothing() {
        answerFiveMixedOutcomes();
        answer(true);
        var awarded = recoveryState();

        answer(false);
        answer(false);

        var later = recoveryState();
        assertEquals(awarded.getRecentOutcomeBits(), later.getRecentOutcomeBits());
        assertEquals(awarded.getRecentOutcomeCount(), later.getRecentOutcomeCount());
        assertEquals(awarded.getLastObservedNormalQuestionId(), later.getLastObservedNormalQuestionId());
    }

    // Review M2 (2026-11-08): a student who has finished cannot answer, so Recovery is never reached.
    @Test
    void aStudentWhoHasFinishedNeverReachesRecovery() {
        answerFiveMixedOutcomes();
        var question = current();
        transactions.executeWithoutResult(status -> locked().setStatus(RacePlayerStatus.FINISHED));

        var rejection = assertThrows(ApiException.class, () -> answerCorrectly(question.getQuestionId()));

        assertEquals(com.quiz_wheelz.exception.ErrorCode.RACE_PLAYER_NOT_RACING, rejection.getErrorCode());
        assertEquals(40, energy());
        assertEquals(5, recoveryState().getRecentOutcomeCount());
        assertNull(recoveryState().getAwardedQuestionId());
    }

    // Review M2: the offer step owns the lifecycle guard. Even a student row still RACING in a race that has ended (no
    // service makes one today: a race finishes once every student is terminal, and nothing cancels a race yet) stays out.
    @ParameterizedTest
    @EnumSource(value = RaceStatus.class, names = {"FINISHED", "CANCELLED"})
    void theOfferStepLeavesRecoveryAloneOnceTheRaceHasEnded(RaceStatus ended) {
        answerFiveMixedOutcomes();
        var question = current();

        transactions.executeWithoutResult(status -> {
            var player = locked();
            player.getRace().setStatus(ended);
            offers.afterAnswer(player, questionRepository.findById(question.getQuestionId()).orElseThrow(),
                    Difficulty.EASY, true, T, standings.calculate(player, T));
        });

        assertEquals(40, energy());
        assertEquals(5, recoveryState().getRecentOutcomeCount());
        assertNull(recoveryState().getAwardedQuestionId());
    }

    @Test
    void twoParallelSubmissionsOfTheQualifyingAnswerGrantOnce() throws Exception {
        answerFiveMixedOutcomes();
        var question = current();
        Long correctChoice = correctChoiceOf(question.getQuestionId());
        var rejected = new AtomicInteger();
        try (var pool = Executors.newFixedThreadPool(2)) {
            var start = new CountDownLatch(1);
            var tasks = List.of(pool.submit(() -> submit(start, question.getQuestionId(), correctChoice, rejected)),
                    pool.submit(() -> submit(start, question.getQuestionId(), correctChoice, rejected)));
            start.countDown();
            for (var task : tasks) {
                task.get(15, TimeUnit.SECONDS);
            }
        }

        assertEquals(1, rejected.get());
        assertEquals(70, energy());
        assertEquals(10, recoveryState().getAwardedEnergy());
    }

    private Void submit(CountDownLatch start, Long questionId, Long choiceId, AtomicInteger rejected) throws Exception {
        start.await();
        var request = new com.quiz_wheelz.dto.answer.SubmitAnswerRequest();
        request.setQuestionId(questionId);
        request.setChoiceId(choiceId);
        try {
            answerService.submitAnswer(second(), request);
        } catch (ApiException exception) {
            rejected.incrementAndGet();
        }
        return null;
    }

    RacePlayerFocusEventRequest focusEvent(RacePlayerFocusEventType type) {
        var event = new RacePlayerFocusEventRequest();
        event.setEventId(UUID.randomUUID());
        event.setType(type);
        return event;
    }

    void answerCorrectly(Long playerQuestionId) {
        var request = new com.quiz_wheelz.dto.answer.SubmitAnswerRequest();
        request.setQuestionId(playerQuestionId);
        request.setChoiceId(correctChoiceOf(playerQuestionId));
        answerService.submitAnswer(second(), request);
    }

    Long correctChoiceOf(Long playerQuestionId) {
        return transactions.execute(status -> questionRepository.findById(playerQuestionId)
                .orElseThrow().getChoices().stream().filter(PlayerQuestionChoice::isCorrect)
                .findFirst().orElseThrow().getId());
    }

    long projectionsDuring(Runnable action) {
        return callsDuring(projections, "projectAt", action);
    }

    long recoveryReadsDuring(Runnable action) {
        return callsDuring(recoveryStates, "findByRacePlayerId", action);
    }

    static long callsDuring(Object spy, String method, Runnable action) {
        clearInvocations(spy);
        action.run();
        return mockingDetails(spy).getInvocations().stream()
                .filter(invocation -> invocation.getMethod().getName().equals(method)).count();
    }

    // C, W, W, C, W: never three correct answers in a row, so the student stays at EASY (+20 energy each).
    void answerFiveMixedOutcomes() {
        answerSecond();
        answer(false);
        answer(false);
        answer(true);
        answer(false);
    }

    void expireActiveQuestion() {
        transactions.executeWithoutResult(status -> questionRepository
                .findFirstByRacePlayerAndStatusOrderByCreatedAtDesc(locked(), PlayerQuestionStatus.ACTIVE)
                .orElseThrow().setExpiresAt(local(T)));
    }

    void seedQualifyingWindow() {
        transactions.executeWithoutResult(status -> {
            var state = new RacePlayerRecoveryState();
            state.setRacePlayer(locked());
            state.setRecentOutcomeBits(QUALIFYING_WINDOW);
            state.setRecentOutcomeCount(6);
            state.setLastObservedNormalQuestionId(questionId);
            recoveryStates.save(state);
        });
    }

    RacePlayerRecoveryState recoveryState() {
        return transactions.execute(status -> recoveryStates.findByRacePlayerId(secondId).orElseThrow());
    }

    List<Object> learningAndMovement() {
        var player = second();
        return List.of(player.getScore(), player.getPosition(), player.getSpeed(), player.getCurrentDifficulty(),
                player.getCorrectAnswers(), player.getWrongAnswers(), player.getStreak());
    }
}
