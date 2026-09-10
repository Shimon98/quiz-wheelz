package com.quiz_wheelz.service.raceplayer;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.quiz_wheelz.dto.answer.SubmitAnswerRequest;
import com.quiz_wheelz.dto.answer.SubmitAnswerResponse;
import com.quiz_wheelz.dto.raceplayer.RacePlayerSessionIdentity;
import com.quiz_wheelz.entitys.*;
import com.quiz_wheelz.enums.*;
import com.quiz_wheelz.repository.*;
import com.quiz_wheelz.service.liveevent.*;
import com.quiz_wheelz.service.question.QuestionTimeoutService;
import com.quiz_wheelz.service.question.StudentAnswerSubmissionService;
import com.quiz_wheelz.service.raceengine.*;
import com.quiz_wheelz.service.teacher.TeacherRaceLivePlayerSnapshotService;
import jakarta.persistence.EntityManager;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.BeforeEach;
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
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;

import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@DataJpaTest(showSql = false)
@ActiveProfiles("test")
@Transactional(propagation = Propagation.NOT_SUPPORTED)
@Import({
        StudentRaceFinishArbitrationService.class, StudentAnswerSubmissionService.class,
        RacePlayerSessionLockService.class, RacePlayerGameplayRequestGuard.class,
        RacePlayerGameplayPresenceService.class, RacePlayerReconnectPolicy.class,
        RacePlayerGameplayTimelineService.class, QuestionTimeoutService.class,
        RaceMovementService.class, RaceMovementCalculator.class, RaceFinishService.class,
        RaceDecisionTimeService.class, RaceEngineService.class, ScoringService.class,
        RaceProgressService.class, DifficultyProgressionService.class,
        RaceLiveEventChangeRecorder.class, RaceLiveEventRecorder.class, RaceLiveEventService.class,
        RaceLiveEventPayloadCodec.class, RaceLiveMutationGate.class, RaceLiveMutationTracker.class,
        TeacherRaceLivePlayerSnapshotService.class, RaceStandingCalculator.class,
        StudentRaceStandingService.class, StudentRaceRuntimeSnapshotMapper.class,
        RaceFinishOrderPolicy.class, RaceChronologyIntegrationFixture.TimeConfiguration.class
})
abstract class RaceChronologyIntegrationFixture {

    static final long T = Instant.parse("2026-09-10T10:00:11Z").toEpochMilli();
    private static final AtomicInteger SEQUENCE = new AtomicInteger();

    @Autowired StudentRaceFinishArbitrationService arbitrationService;
    @Autowired StudentAnswerSubmissionService answerService;
    @Autowired RaceLiveMutationGate liveMutationGate;
    @Autowired RacePlayerRepository playerRepository;
    @Autowired RaceRepository raceRepository;
    @Autowired PlayerQuestionRepository questionRepository;
    @Autowired RaceLiveEventRepository eventRepository;
    @Autowired EntityManager entityManager;
    @Autowired PlatformTransactionManager transactionManager;
    @Autowired ControlledTime clock;

    @MockitoBean RedisPresenceService redisPresenceService;
    @MockitoBean CurrentRacePlayerService currentRacePlayerService;

    TransactionTemplate transactions;
    Long raceId;
    Long firstId;
    Long secondId;
    Long questionId;
    Long choiceId;
    HttpServletRequest firstRequest;
    HttpServletRequest secondRequest;

    @BeforeEach
    void prepareChronology() {
        clock.set(T);
        transactions = new TransactionTemplate(transactionManager);
        transactions.executeWithoutResult(status -> persistRace());
        firstRequest = session(firstId);
        secondRequest = session(secondId);
        when(redisPresenceService.isOnline(anyLong(), anyLong())).thenReturn(true);
        when(redisPresenceService.findLastGameplayActivityAt(anyLong(), anyLong()))
                .thenReturn(Optional.of(Instant.ofEpochMilli(T)));
    }

    HttpServletRequest session(Long playerId) {
        HttpServletRequest request = mock(HttpServletRequest.class);
        when(currentRacePlayerService.resolveCurrentRacePlayerIdentity(request))
                .thenReturn(new RacePlayerSessionIdentity(raceId, playerId));
        return request;
    }

    SubmitAnswerResponse answerSecond() {
        Race identityRace = new Race();
        identityRace.setId(raceId);
        RacePlayer identityPlayer = new RacePlayer();
        identityPlayer.setId(secondId);
        identityPlayer.setRace(identityRace);
        SubmitAnswerRequest request = new SubmitAnswerRequest();
        request.setQuestionId(questionId);
        request.setChoiceId(choiceId);
        return answerService.submitAnswer(identityPlayer, request);
    }

    RacePlayer second() {
        return transactions.execute(status -> playerRepository.findById(secondId).orElseThrow());
    }

    Race race() {
        return transactions.execute(status -> raceRepository.findById(raceId).orElseThrow());
    }

    PlayerQuestion question() {
        return transactions.execute(status -> questionRepository.findById(questionId).orElseThrow());
    }

    List<RaceLiveEventType> eventTypes() {
        return transactions.execute(status -> eventRepository
                .findAfterVersionOrdered(raceId, 0L, PageRequest.of(0, 100))
                .stream().map(RaceLiveEvent::getType).toList());
    }

    void secondPosition(double position) {
        transactions.executeWithoutResult(status ->
                playerRepository.findById(secondId).orElseThrow().setPosition(position));
    }

    void questionExpiry(long epochMs) {
        transactions.executeWithoutResult(status -> questionRepository.findById(questionId)
                .orElseThrow().setExpiresAt(local(epochMs)));
    }

    static LocalDateTime local(long epochMs) {
        return LocalDateTime.ofInstant(Instant.ofEpochMilli(epochMs), ZoneOffset.UTC);
    }

    private void persistRace() {
        int sequence = SEQUENCE.incrementAndGet();
        User teacher = new User();
        teacher.setUsername("chronology-teacher-" + sequence);
        teacher.setDisplayName("Teacher");
        entityManager.persist(teacher);
        Subject subject = new Subject();
        subject.setName("Chronology Math " + sequence);
        subject.setCode("CHRONOLOGY_" + sequence);
        entityManager.persist(subject);
        Race race = new Race();
        race.setRoomCode(String.format("C%05d", sequence));
        race.setTitle("Chronology");
        race.setMaxPlayers(8);
        race.setTotalDistance(1000);
        race.setTeacher(teacher);
        race.setSubject(subject);
        race.setStatus(RaceStatus.IN_PROGRESS);
        race.setStartedAt(local(T - 60_000));
        entityManager.persist(race);
        RacePlayer first = player(race, "First", 1, 1000.0);
        first.setStatus(RacePlayerStatus.FINISHED);
        first.setSpeed(0.0);
        first.setFinishedAtEpochMs(T - 1_000);
        first.setFinishedAt(local(T - 1_000));
        first.setMovementUpdatedAtEpochMs(T - 1_000);
        entityManager.persist(first);
        RacePlayer second = player(race, "Second", 2, 995.0);
        entityManager.persist(second);
        QuestionTemplate template = new QuestionTemplate();
        template.setSubject(subject);
        template.setType(QuestionType.ADDITION);
        template.setDifficulty(Difficulty.EASY);
        template.setMinValue(1);
        template.setMaxValue(10);
        template.setTimeLimitSeconds(30);
        template.setChoicesCount(4);
        entityManager.persist(template);
        PlayerQuestion question = new PlayerQuestion();
        question.setRacePlayer(second);
        question.setQuestionTemplate(template);
        question.setQuestionText("1 + 1");
        question.setCorrectAnswerValue(2);
        question.setTimeLimitSeconds(30);
        question.setExpiresAt(local(T + 30_000));
        entityManager.persist(question);
        PlayerQuestionChoice choice = new PlayerQuestionChoice();
        choice.setPlayerQuestion(question);
        choice.setChoiceText("2");
        choice.setAnswerValue(2);
        choice.setCorrect(true);
        choice.setDisplayOrder(1);
        entityManager.persist(choice);
        entityManager.flush();
        raceId = race.getId();
        firstId = first.getId();
        secondId = second.getId();
        questionId = question.getId();
        choiceId = choice.getId();
    }

    RacePlayer player(Race race, String name, int lane, double position) {
        RacePlayer player = new RacePlayer();
        player.setRace(race);
        player.setDisplayName(name);
        player.setLaneNumber(lane);
        player.setStatus(RacePlayerStatus.RACING);
        player.setPosition(position);
        player.setSpeed(1.0);
        player.setMovementUpdatedAtEpochMs(T);
        player.setStartedAt(race.getStartedAt());
        player.setLastSeenAt(local(T));
        return player;
    }

    static class ControlledTime extends Clock {

        private final AtomicLong epochMs = new AtomicLong(T);

        void set(long nextEpochMs) {
            epochMs.set(nextEpochMs);
        }

        @Override
        public ZoneId getZone() {
            return ZoneOffset.UTC;
        }

        @Override
        public Clock withZone(ZoneId zone) {
            if (!getZone().equals(zone)) {
                throw new IllegalArgumentException();
            }
            return this;
        }

        @Override
        public Instant instant() {
            return Instant.ofEpochMilli(millis());
        }

        @Override
        public long millis() {
            return epochMs.get();
        }
    }

    @TestConfiguration
    static class TimeConfiguration {

        @Bean ObjectMapper objectMapper() {
            return new ObjectMapper();
        }

        @Bean ControlledTime clock() {
            return new ControlledTime();
        }

        @Bean ZoneId applicationZoneId() {
            return ZoneOffset.UTC;
        }
    }
}
