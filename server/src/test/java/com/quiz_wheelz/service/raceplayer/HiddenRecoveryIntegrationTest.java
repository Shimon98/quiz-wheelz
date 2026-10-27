package com.quiz_wheelz.service.raceplayer;

import com.quiz_wheelz.config.ConfigPropertyKeys;
import com.quiz_wheelz.entitys.*;
import com.quiz_wheelz.enums.*;
import com.quiz_wheelz.exception.ApiException;
import com.quiz_wheelz.repository.RacePlayerRecoveryStateRepository;
import com.quiz_wheelz.service.recovery.HiddenRecoveryService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoSpyBean;

import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.clearInvocations;
import static org.mockito.Mockito.mockingDetails;

@TestPropertySource(properties = ConfigPropertyKeys.QUIZWHEELZ_RECOVERY_ENABLED + "=true")
@Import(HiddenRecoveryService.class)
class HiddenRecoveryIntegrationTest extends S4ChallengeFlowFixture {
    // Oldest first, newest in bit 0: C, W, W, C, W, C.
    static final int QUALIFYING_WINDOW = 0b100101;

    @Autowired RacePlayerRecoveryStateRepository recoveryStates;
    @Autowired HiddenRecoveryService recovery;
    @Autowired StudentRaceStandingService standings;
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
                    gameplay, T, standings.calculate(player, T)));
            assertEquals(60, gameplay.getChallengeEnergy());
            status.setRollbackOnly();
        });

        assertEquals(50, energy());
        assertNull(recoveryState().getAwardedQuestionId());
        assertEquals(before, learningAndMovement());
        transactions.executeWithoutResult(status -> {
            var player = locked();
            recovery.nudgeAfterNormalGain(player, questionRepository.findById(questionId).orElseThrow(),
                    stateService.obtainForLockedPlayer(player), T, standings.calculate(player, T));
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
                    stateService.obtainForLockedPlayer(player), T, null));
        });

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
        Long correctChoice = correctChoiceOf(question.getQuestionId());
        expireActiveQuestion();
        var request = new com.quiz_wheelz.dto.answer.SubmitAnswerRequest();
        request.setQuestionId(question.getQuestionId());
        request.setChoiceId(correctChoice);

        var rejection = assertThrows(ApiException.class, () -> answerService.submitAnswer(second(), request));

        assertEquals(com.quiz_wheelz.exception.ErrorCode.QUESTION_EXPIRED, rejection.getErrorCode());
        var state = recoveryState();
        assertEquals(0b10, state.getRecentOutcomeBits());
        assertEquals(2, state.getRecentOutcomeCount());
        assertEquals(question.getQuestionId(), state.getLastObservedNormalQuestionId());
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

    Long correctChoiceOf(Long playerQuestionId) {
        return transactions.execute(status -> questionRepository.findById(playerQuestionId)
                .orElseThrow().getChoices().stream().filter(PlayerQuestionChoice::isCorrect)
                .findFirst().orElseThrow().getId());
    }

    long projectionsDuring(Runnable action) {
        clearInvocations(projections);
        action.run();
        return mockingDetails(projections).getInvocations().stream()
                .filter(invocation -> invocation.getMethod().getName().equals("projectAt")).count();
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
