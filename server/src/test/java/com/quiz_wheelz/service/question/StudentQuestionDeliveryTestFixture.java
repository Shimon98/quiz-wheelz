package com.quiz_wheelz.service.question;

import com.quiz_wheelz.common.QuestionRules;
import com.quiz_wheelz.dto.question.QuestionPlan;
import com.quiz_wheelz.dto.question.internal.InternalGeneratedQuestion;
import com.quiz_wheelz.dto.question.internal.InternalGeneratedQuestionChoice;
import com.quiz_wheelz.dto.question.student.StudentQuestionChoiceResponse;
import com.quiz_wheelz.dto.question.student.StudentQuestionResponse;
import com.quiz_wheelz.entitys.PlayerQuestion;
import com.quiz_wheelz.entitys.PlayerQuestionChoice;
import com.quiz_wheelz.entitys.QuestionTemplate;
import com.quiz_wheelz.entitys.Race;
import com.quiz_wheelz.entitys.RacePlayer;
import com.quiz_wheelz.entitys.Subject;
import com.quiz_wheelz.enums.AdaptiveMode;
import com.quiz_wheelz.enums.AssistanceLevel;
import com.quiz_wheelz.enums.Difficulty;
import com.quiz_wheelz.enums.PlayerQuestionStatus;
import com.quiz_wheelz.enums.QuestionGenerationPattern;
import com.quiz_wheelz.enums.QuestionType;
import com.quiz_wheelz.enums.RacePlayerStatus;
import com.quiz_wheelz.enums.RaceStatus;
import com.quiz_wheelz.repository.PlayerQuestionChoiceRepository;
import com.quiz_wheelz.repository.PlayerQuestionRepository;
import com.quiz_wheelz.repository.RacePlayerRepository;
import com.quiz_wheelz.service.raceplayer.RacePlayerGameplayRequestGuard;
import com.quiz_wheelz.service.liveevent.RaceLiveEventChangeRecorder;
import com.quiz_wheelz.service.liveevent.RaceLiveEventRecorder;
import com.quiz_wheelz.service.liveevent.RaceLiveMutationTracker;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

final class StudentQuestionDeliveryTestFixture {

    static final Instant FIXED_INSTANT = Instant.parse("2026-06-30T10:00:00Z");
    static final ZoneId FIXED_ZONE = ZoneId.of("UTC");
    static final long RACE_ID = 3L;
    static final long RACE_PLAYER_ID = 17L;

    final RacePlayerRepository racePlayerRepository = mock(RacePlayerRepository.class);
    final PlayerQuestionRepository playerQuestionRepository = mock(PlayerQuestionRepository.class);
    final PlayerQuestionChoiceRepository playerQuestionChoiceRepository =
            mock(PlayerQuestionChoiceRepository.class);
    final RacePlayerQuestionPlanService racePlayerQuestionPlanService =
            mock(RacePlayerQuestionPlanService.class);
    final QuestionGenerationService questionGenerationService =
            mock(QuestionGenerationService.class);
    final PlayerQuestionPersistenceService playerQuestionPersistenceService =
            mock(PlayerQuestionPersistenceService.class);
    final StudentQuestionResponseMapper studentQuestionResponseMapper =
            mock(StudentQuestionResponseMapper.class);
    final RacePlayerGameplayRequestGuard gameplayRequestGuard =
            mock(RacePlayerGameplayRequestGuard.class);
    final RaceLiveEventRecorder liveEventRecorder = mock(RaceLiveEventRecorder.class);
    final RaceLiveEventChangeRecorder liveEventChangeRecorder =
            new RaceLiveEventChangeRecorder(liveEventRecorder);
    final com.quiz_wheelz.service.liveevent.RaceLiveMutationGate liveMutationGate =
            mock(com.quiz_wheelz.service.liveevent.RaceLiveMutationGate.class);
    final StudentQuestionDeliveryService studentQuestionDeliveryService =
            new StudentQuestionDeliveryService(
                    racePlayerRepository,
                    playerQuestionRepository,
                    playerQuestionChoiceRepository,
                    racePlayerQuestionPlanService,
                    questionGenerationService,
                    playerQuestionPersistenceService,
                    studentQuestionResponseMapper,
                    gameplayRequestGuard,
                    new RaceLiveMutationTracker(liveMutationGate, liveEventChangeRecorder),
                    Clock.fixed(FIXED_INSTANT, FIXED_ZONE)
            );

    {
        when(liveMutationGate.lockIfActive(any())).thenAnswer(invocation ->
                Optional.of(invocation.<RacePlayer>getArgument(0).getRace())
        );
    }

    RacePlayer createRacePlayer() {
        return createRacePlayer(RacePlayerStatus.RACING, RaceStatus.IN_PROGRESS);
    }

    RacePlayer createRacePlayer(RacePlayerStatus playerStatus, RaceStatus raceStatus) {
        Race race = new Race();
        race.setId(RACE_ID);
        race.setStatus(raceStatus);

        RacePlayer racePlayer = new RacePlayer();
        racePlayer.setId(RACE_PLAYER_ID);
        racePlayer.setRace(race);
        racePlayer.setStatus(playerStatus);
        return racePlayer;
    }

    QuestionPlan createQuestionPlan() {
        return new QuestionPlan(
                createMathSubject(),
                QuestionType.ADDITION,
                Difficulty.EASY,
                1,
                10,
                QuestionRules.DEFAULT_TIME_LIMIT_SECONDS,
                QuestionRules.DEFAULT_CHOICES_COUNT,
                QuestionGenerationPattern.BINARY_OPERATION,
                AdaptiveMode.BASIC,
                AssistanceLevel.NONE
        );
    }

    InternalGeneratedQuestion createGeneratedQuestion() {
        return new InternalGeneratedQuestion(
                createMathSubject(),
                new QuestionTemplate(),
                QuestionType.ADDITION,
                Difficulty.EASY,
                "6 + 6 = ?",
                12,
                QuestionRules.DEFAULT_TIME_LIMIT_SECONDS,
                List.of(
                        new InternalGeneratedQuestionChoice("12", 12, true, 1),
                        new InternalGeneratedQuestionChoice("10", 10, false, 2),
                        new InternalGeneratedQuestionChoice("14", 14, false, 3),
                        new InternalGeneratedQuestionChoice("15", 15, false, 4)
                )
        );
    }

    PlayerQuestion createPlayerQuestion(PlayerQuestionStatus status, LocalDateTime expiresAt) {
        PlayerQuestion playerQuestion = new PlayerQuestion();
        playerQuestion.setQuestionTemplate(new QuestionTemplate());
        playerQuestion.setQuestionText("6 + 6 = ?");
        playerQuestion.setCorrectAnswerValue(12);
        playerQuestion.setTimeLimitSeconds(QuestionRules.DEFAULT_TIME_LIMIT_SECONDS);
        playerQuestion.setStatus(status);
        playerQuestion.setExpiresAt(expiresAt);
        return playerQuestion;
    }

    List<PlayerQuestionChoice> createPlayerQuestionChoices(PlayerQuestion playerQuestion) {
        return List.of(
                createPlayerQuestionChoice(playerQuestion, "12", 12, true, 1),
                createPlayerQuestionChoice(playerQuestion, "10", 10, false, 2)
        );
    }

    PlayerQuestionChoice createPlayerQuestionChoice(
            PlayerQuestion playerQuestion,
            String choiceText,
            Integer answerValue,
            boolean correct,
            Integer displayOrder
    ) {
        PlayerQuestionChoice choice = new PlayerQuestionChoice();
        choice.setPlayerQuestion(playerQuestion);
        choice.setChoiceText(choiceText);
        choice.setAnswerValue(answerValue);
        choice.setCorrect(correct);
        choice.setDisplayOrder(displayOrder);
        return choice;
    }

    StudentQuestionResponse createStudentQuestionResponse() {
        return new StudentQuestionResponse(
                1L,
                "6 + 6 = ?",
                QuestionRules.DEFAULT_TIME_LIMIT_SECONDS,
                FIXED_INSTANT.toEpochMilli(),
                FIXED_INSTANT.plusSeconds(QuestionRules.DEFAULT_TIME_LIMIT_SECONDS).toEpochMilli(),
                List.of(
                        new StudentQuestionChoiceResponse(1L, "12", 1),
                        new StudentQuestionChoiceResponse(2L, "10", 2)
                )
        );
    }

    LocalDateTime now() {
        return LocalDateTime.ofInstant(FIXED_INSTANT, FIXED_ZONE);
    }

    private Subject createMathSubject() {
        Subject subject = new Subject();
        subject.setCode(QuestionRules.DEFAULT_SUBJECT_CODE);
        subject.setName("Math");
        subject.setActive(true);
        return subject;
    }
}
