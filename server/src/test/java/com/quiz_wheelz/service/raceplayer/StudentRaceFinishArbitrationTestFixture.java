package com.quiz_wheelz.service.raceplayer;

import com.quiz_wheelz.dto.raceplayer.RacePlayerSessionIdentity;
import com.quiz_wheelz.dto.raceplayer.StudentRaceFinishArbitrationResponse;
import com.quiz_wheelz.entitys.PlayerQuestion;
import com.quiz_wheelz.entitys.Race;
import com.quiz_wheelz.entitys.RacePlayer;
import com.quiz_wheelz.enums.Difficulty;
import com.quiz_wheelz.enums.PlayerQuestionStatus;
import com.quiz_wheelz.enums.RacePlayerStatus;
import com.quiz_wheelz.enums.RaceStatus;
import com.quiz_wheelz.repository.PlayerQuestionRepository;
import com.quiz_wheelz.repository.RacePlayerRepository;
import com.quiz_wheelz.repository.RaceRepository;
import com.quiz_wheelz.service.liveevent.RaceLiveEventChangeRecorder;
import com.quiz_wheelz.service.liveevent.RaceLiveEventRecorder;
import com.quiz_wheelz.service.question.QuestionTimeoutService;
import com.quiz_wheelz.service.raceengine.DifficultyProgressionService;
import com.quiz_wheelz.service.raceengine.RaceEngineService;
import com.quiz_wheelz.service.raceengine.RaceDecisionTimeService;
import com.quiz_wheelz.service.raceengine.RaceFinishOrderPolicy;
import com.quiz_wheelz.service.raceengine.RaceFinishService;
import com.quiz_wheelz.service.raceengine.RaceMovementCalculator;
import com.quiz_wheelz.service.raceengine.RaceMovementService;
import com.quiz_wheelz.service.raceengine.RacePlayerGameplayTimelineService;
import com.quiz_wheelz.service.raceengine.RaceProgressService;
import com.quiz_wheelz.service.raceengine.ScoringService;
import com.quiz_wheelz.service.raceplayer.RacePlayerGameplayPresenceService.GameplayPresenceDecision;
import jakarta.servlet.http.HttpServletRequest;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

final class StudentRaceFinishArbitrationTestFixture {

    static final Instant NOW = Instant.parse("2026-09-10T10:00:11Z");
    static final ZoneId ZONE = ZoneId.of("UTC");
    static final long T = NOW.toEpochMilli();
    static final long ANCHOR = T - 1_000;
    static final long RACE_ID = 1L;
    static final long EVENT_VERSION = 7L;
    static final int TOTAL_DISTANCE = 1000;

    final RacePlayerSessionLockService sessionLockService = mock(RacePlayerSessionLockService.class);
    final RacePlayerRepository racePlayerRepository = mock(RacePlayerRepository.class);
    final RaceRepository raceRepository = mock(RaceRepository.class);
    final PlayerQuestionRepository playerQuestionRepository = mock(PlayerQuestionRepository.class);
    final RacePlayerGameplayPresenceService presenceService =
            mock(RacePlayerGameplayPresenceService.class);
    final RaceLiveEventRecorder liveEventRecorder = mock(RaceLiveEventRecorder.class);
    final HttpServletRequest request = mock(HttpServletRequest.class);
    final Race race = new Race();
    final List<RacePlayer> players = new ArrayList<>();
    final StudentRaceFinishArbitrationService service;

    StudentRaceFinishArbitrationTestFixture() {
        Clock clock = Clock.fixed(NOW, ZONE);
        race.setId(RACE_ID);
        race.setStatus(RaceStatus.IN_PROGRESS);
        race.setTotalDistance(TOTAL_DISTANCE);
        race.setMaxPlayers(8);
        race.setLiveEventVersion(EVENT_VERSION);

        RaceFinishService finishService = new RaceFinishService(racePlayerRepository, clock);
        RaceMovementCalculator movementCalculator = new RaceMovementCalculator();
        RaceMovementService movementService = new RaceMovementService(
                movementCalculator,
                finishService,
                playerQuestionRepository,
                clock
        );
        QuestionTimeoutService timeoutService = new QuestionTimeoutService(
                movementService,
                new RaceEngineService(
                        new ScoringService(),
                        new RaceProgressService(),
                        new DifficultyProgressionService(),
                        finishService
                ),
                playerQuestionRepository,
                clock
        );
        RacePlayerGameplayTimelineService timelineService =
                new RacePlayerGameplayTimelineService(timeoutService, movementService);
        RaceStandingCalculator standingCalculator = new RaceStandingCalculator(ZONE);
        service = new StudentRaceFinishArbitrationService(
                sessionLockService,
                racePlayerRepository,
                raceRepository,
                new RacePlayerGameplayRequestGuard(
                        presenceService,
                        timelineService,
                        racePlayerRepository
                ),
                presenceService,
                timelineService,
                finishService,
                new RaceLiveEventChangeRecorder(liveEventRecorder),
                new StudentRaceStandingService(racePlayerRepository, standingCalculator),
                new StudentRaceRuntimeSnapshotMapper(),
                new RaceFinishOrderPolicy(standingCalculator, movementCalculator),
                new RaceDecisionTimeService(raceRepository),
                clock
        );

        lenient().when(raceRepository.findStatusById(RACE_ID))
                .thenAnswer(invocation -> race.getStatus());
        lenient().when(raceRepository.advanceDecisionTimeFloor(
                org.mockito.ArgumentMatchers.eq(RACE_ID), org.mockito.ArgumentMatchers.anyLong()
        )).thenAnswer(invocation -> {
            long requested = invocation.getArgument(1);
            Long floor = race.getAuthoritativeDecisionTimeFloorEpochMs();
            race.setAuthoritativeDecisionTimeFloorEpochMs(floor == null ? requested : Math.max(floor, requested));
            return 1;
        });
        lenient().when(raceRepository.findLockedDecisionTimeFloor(RACE_ID))
                .thenAnswer(invocation -> race.getAuthoritativeDecisionTimeFloorEpochMs());
        lenient().when(raceRepository.findLockedById(RACE_ID))
                .thenReturn(Optional.of(race));
        lenient().when(racePlayerRepository.findAllLockedByRaceIdOrderById(RACE_ID))
                .thenAnswer(invocation -> players.stream()
                        .sorted(Comparator.comparing(RacePlayer::getId))
                        .toList());
        lenient().when(racePlayerRepository.findByRaceOrderByLaneNumberAsc(race))
                .thenAnswer(invocation -> List.copyOf(players));
        lenient().when(playerQuestionRepository.save(any()))
                .thenAnswer(invocation -> invocation.getArgument(0));
    }

    RacePlayer racing(long id, double position, double speed, long anchorEpochMs) {
        RacePlayer player = player(id, RacePlayerStatus.RACING);
        player.setPosition(position);
        player.setSpeed(speed);
        player.setMovementUpdatedAtEpochMs(anchorEpochMs);
        return player;
    }

    RacePlayer finished(long id, long finishedAtEpochMs) {
        RacePlayer player = player(id, RacePlayerStatus.FINISHED);
        player.setPosition((double) TOTAL_DISTANCE);
        player.setSpeed(0.0);
        player.setMovementUpdatedAtEpochMs(finishedAtEpochMs);
        player.setFinishedAtEpochMs(finishedAtEpochMs);
        player.setFinishedAt(LocalDateTime.ofInstant(Instant.ofEpochMilli(finishedAtEpochMs), ZONE));
        return player;
    }

    RacePlayer waiting(long id) {
        RacePlayer player = player(id, RacePlayerStatus.WAITING);
        player.setPosition(0.0);
        player.setSpeed(0.0);
        return player;
    }

    void requester(RacePlayer racePlayer) {
        when(sessionLockService.resolveIdentity(request))
                .thenReturn(new RacePlayerSessionIdentity(RACE_ID, racePlayer.getId()));
        lenient().when(racePlayerRepository.existsByIdAndRaceId(racePlayer.getId(), RACE_ID))
                .thenReturn(true);
    }

    void online(RacePlayer racePlayer) {
        lenient().when(presenceService.resolve(racePlayer, NOW))
                .thenReturn(new GameplayPresenceDecision(true, true, false, T));
    }

    void absent(RacePlayer racePlayer, long cutoffEpochMs) {
        lenient().when(presenceService.resolve(racePlayer, NOW))
                .thenReturn(new GameplayPresenceDecision(true, false, false, cutoffEpochMs));
    }

    PlayerQuestion activeQuestion(RacePlayer racePlayer, long expiresAtEpochMs) {
        PlayerQuestion question = new PlayerQuestion();
        question.setStatus(PlayerQuestionStatus.ACTIVE);
        question.setExpiresAt(LocalDateTime.ofInstant(Instant.ofEpochMilli(expiresAtEpochMs), ZONE));
        lenient().when(playerQuestionRepository.findFirstByRacePlayerAndStatusOrderByCreatedAtDesc(
                racePlayer,
                PlayerQuestionStatus.ACTIVE
        )).thenAnswer(invocation -> question.getStatus() == PlayerQuestionStatus.ACTIVE
                ? Optional.of(question)
                : Optional.empty());
        return question;
    }

    StudentRaceFinishArbitrationResponse arbitrate() {
        return service.arbitrate(request);
    }

    private RacePlayer player(long id, RacePlayerStatus status) {
        RacePlayer player = new RacePlayer();
        player.setId(id);
        player.setRace(race);
        player.setDisplayName("Player " + id);
        player.setLaneNumber((int) id);
        player.setVehicleTypeKey("TOY_CAR");
        player.setVehicleColorKey("GREEN");
        player.setStatus(status);
        player.setCurrentDifficulty(Difficulty.EASY);
        player.setScore(0);
        player.setStreak(0);
        player.setHighestStreak(0);
        player.setCorrectAnswers(0);
        player.setWrongAnswers(0);
        player.setDifficultyCorrectStreak(0);
        player.setDifficultyWrongStreak(0);
        players.add(player);
        return player;
    }
}
