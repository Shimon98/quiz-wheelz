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
import com.quiz_wheelz.entitys.RacePlayer;
import com.quiz_wheelz.entitys.Subject;
import com.quiz_wheelz.enums.AdaptiveMode;
import com.quiz_wheelz.enums.AssistanceLevel;
import com.quiz_wheelz.enums.Difficulty;
import com.quiz_wheelz.enums.PlayerQuestionStatus;
import com.quiz_wheelz.enums.QuestionGenerationPattern;
import com.quiz_wheelz.enums.QuestionType;
import com.quiz_wheelz.exception.ApiException;
import com.quiz_wheelz.exception.ErrorCode;
import com.quiz_wheelz.repository.PlayerQuestionChoiceRepository;
import com.quiz_wheelz.repository.PlayerQuestionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class StudentQuestionDeliveryServiceTest {

    private static final Instant FIXED_INSTANT = Instant.parse("2026-06-30T10:00:00Z");
    private static final ZoneId FIXED_ZONE = ZoneId.of("UTC");

    @Mock
    private PlayerQuestionRepository playerQuestionRepository;

    @Mock
    private PlayerQuestionChoiceRepository playerQuestionChoiceRepository;

    @Mock
    private QuestionGenerationService questionGenerationService;

    @Mock
    private PlayerQuestionPersistenceService playerQuestionPersistenceService;

    @Mock
    private StudentQuestionResponseMapper studentQuestionResponseMapper;

    private StudentQuestionDeliveryService studentQuestionDeliveryService;

    @BeforeEach
    void setUp() {
        Clock fixedClock = Clock.fixed(FIXED_INSTANT, FIXED_ZONE);

        studentQuestionDeliveryService = new StudentQuestionDeliveryService(
                playerQuestionRepository,
                playerQuestionChoiceRepository,
                questionGenerationService,
                playerQuestionPersistenceService,
                studentQuestionResponseMapper,
                fixedClock
        );
    }

    @Test
    void shouldReturnExistingActiveQuestionWhenNotExpired() {
        RacePlayer racePlayer = new RacePlayer();
        QuestionPlan questionPlan = createQuestionPlan();
        PlayerQuestion activeQuestion = createPlayerQuestion(
                PlayerQuestionStatus.ACTIVE,
                now().plusSeconds(QuestionRules.DEFAULT_TIME_LIMIT_SECONDS)
        );
        List<PlayerQuestionChoice> choices = createPlayerQuestionChoices(activeQuestion);
        StudentQuestionResponse expectedResponse = createStudentQuestionResponse();

        when(playerQuestionRepository.findFirstByRacePlayerAndStatusOrderByCreatedAtDesc(
                racePlayer,
                PlayerQuestionStatus.ACTIVE
        )).thenReturn(Optional.of(activeQuestion));
        when(playerQuestionChoiceRepository.findByPlayerQuestionOrderByDisplayOrderAsc(activeQuestion))
                .thenReturn(choices);
        when(studentQuestionResponseMapper.toResponse(activeQuestion, choices))
                .thenReturn(expectedResponse);

        StudentQuestionResponse result = studentQuestionDeliveryService.getOrCreateCurrentQuestion(
                racePlayer,
                questionPlan
        );

        assertSame(expectedResponse, result);

        verify(questionGenerationService, never()).generate(any(QuestionPlan.class));
        verify(playerQuestionPersistenceService, never()).persistGeneratedQuestion(any(), any());
    }

    @Test
    void shouldGenerateAndPersistQuestionWhenNoActiveQuestionExists() {
        RacePlayer racePlayer = new RacePlayer();
        QuestionPlan questionPlan = createQuestionPlan();
        InternalGeneratedQuestion generatedQuestion = createGeneratedQuestion();
        PlayerQuestion persistedQuestion = createPlayerQuestion(
                PlayerQuestionStatus.ACTIVE,
                now().plusSeconds(QuestionRules.DEFAULT_TIME_LIMIT_SECONDS)
        );
        List<PlayerQuestionChoice> choices = createPlayerQuestionChoices(persistedQuestion);
        StudentQuestionResponse expectedResponse = createStudentQuestionResponse();

        when(playerQuestionRepository.findFirstByRacePlayerAndStatusOrderByCreatedAtDesc(
                racePlayer,
                PlayerQuestionStatus.ACTIVE
        )).thenReturn(Optional.empty());
        when(questionGenerationService.generate(questionPlan)).thenReturn(generatedQuestion);
        when(playerQuestionPersistenceService.persistGeneratedQuestion(racePlayer, generatedQuestion))
                .thenReturn(persistedQuestion);
        when(playerQuestionChoiceRepository.findByPlayerQuestionOrderByDisplayOrderAsc(persistedQuestion))
                .thenReturn(choices);
        when(studentQuestionResponseMapper.toResponse(persistedQuestion, choices))
                .thenReturn(expectedResponse);

        StudentQuestionResponse result = studentQuestionDeliveryService.getOrCreateCurrentQuestion(
                racePlayer,
                questionPlan
        );

        assertSame(expectedResponse, result);

        verify(questionGenerationService).generate(questionPlan);
        verify(playerQuestionPersistenceService).persistGeneratedQuestion(racePlayer, generatedQuestion);
    }

    @Test
    void shouldExpireExistingQuestionAndGenerateNewOneWhenQuestionExpired() {
        RacePlayer racePlayer = new RacePlayer();
        QuestionPlan questionPlan = createQuestionPlan();
        PlayerQuestion expiredActiveQuestion = createPlayerQuestion(
                PlayerQuestionStatus.ACTIVE,
                now().minusSeconds(1)
        );
        InternalGeneratedQuestion generatedQuestion = createGeneratedQuestion();
        PlayerQuestion persistedQuestion = createPlayerQuestion(
                PlayerQuestionStatus.ACTIVE,
                now().plusSeconds(QuestionRules.DEFAULT_TIME_LIMIT_SECONDS)
        );
        List<PlayerQuestionChoice> choices = createPlayerQuestionChoices(persistedQuestion);
        StudentQuestionResponse expectedResponse = createStudentQuestionResponse();

        when(playerQuestionRepository.findFirstByRacePlayerAndStatusOrderByCreatedAtDesc(
                racePlayer,
                PlayerQuestionStatus.ACTIVE
        )).thenReturn(Optional.of(expiredActiveQuestion));
        when(questionGenerationService.generate(questionPlan)).thenReturn(generatedQuestion);
        when(playerQuestionPersistenceService.persistGeneratedQuestion(racePlayer, generatedQuestion))
                .thenReturn(persistedQuestion);
        when(playerQuestionChoiceRepository.findByPlayerQuestionOrderByDisplayOrderAsc(persistedQuestion))
                .thenReturn(choices);
        when(studentQuestionResponseMapper.toResponse(persistedQuestion, choices))
                .thenReturn(expectedResponse);

        StudentQuestionResponse result = studentQuestionDeliveryService.getOrCreateCurrentQuestion(
                racePlayer,
                questionPlan
        );

        assertSame(expectedResponse, result);
        assertEquals(PlayerQuestionStatus.EXPIRED, expiredActiveQuestion.getStatus());

        verify(playerQuestionRepository).save(expiredActiveQuestion);
        verify(questionGenerationService).generate(questionPlan);
        verify(playerQuestionPersistenceService).persistGeneratedQuestion(racePlayer, generatedQuestion);
    }

    @Test
    void shouldTreatQuestionExpiringNowAsExpired() {
        RacePlayer racePlayer = new RacePlayer();
        QuestionPlan questionPlan = createQuestionPlan();
        PlayerQuestion activeQuestion = createPlayerQuestion(
                PlayerQuestionStatus.ACTIVE,
                now()
        );
        InternalGeneratedQuestion generatedQuestion = createGeneratedQuestion();
        PlayerQuestion persistedQuestion = createPlayerQuestion(
                PlayerQuestionStatus.ACTIVE,
                now().plusSeconds(QuestionRules.DEFAULT_TIME_LIMIT_SECONDS)
        );
        List<PlayerQuestionChoice> choices = createPlayerQuestionChoices(persistedQuestion);
        StudentQuestionResponse expectedResponse = createStudentQuestionResponse();

        when(playerQuestionRepository.findFirstByRacePlayerAndStatusOrderByCreatedAtDesc(
                racePlayer,
                PlayerQuestionStatus.ACTIVE
        )).thenReturn(Optional.of(activeQuestion));
        when(questionGenerationService.generate(questionPlan)).thenReturn(generatedQuestion);
        when(playerQuestionPersistenceService.persistGeneratedQuestion(racePlayer, generatedQuestion))
                .thenReturn(persistedQuestion);
        when(playerQuestionChoiceRepository.findByPlayerQuestionOrderByDisplayOrderAsc(persistedQuestion))
                .thenReturn(choices);
        when(studentQuestionResponseMapper.toResponse(persistedQuestion, choices))
                .thenReturn(expectedResponse);

        StudentQuestionResponse result = studentQuestionDeliveryService.getOrCreateCurrentQuestion(
                racePlayer,
                questionPlan
        );

        assertSame(expectedResponse, result);
        assertEquals(PlayerQuestionStatus.EXPIRED, activeQuestion.getStatus());
    }

    @Test
    void shouldRejectMissingRacePlayer() {
        ApiException exception = assertThrows(
                ApiException.class,
                () -> studentQuestionDeliveryService.getOrCreateCurrentQuestion(
                        null,
                        createQuestionPlan()
                )
        );

        assertEquals(ErrorCode.INVALID_QUESTION_TEMPLATE_CONFIG, exception.getErrorCode());
    }

    @Test
    void shouldRejectMissingQuestionPlan() {
        ApiException exception = assertThrows(
                ApiException.class,
                () -> studentQuestionDeliveryService.getOrCreateCurrentQuestion(
                        new RacePlayer(),
                        null
                )
        );

        assertEquals(ErrorCode.INVALID_QUESTION_TEMPLATE_CONFIG, exception.getErrorCode());
    }

    @Test
    void shouldRejectExistingActiveQuestionWithoutExpiresAt() {
        RacePlayer racePlayer = new RacePlayer();
        QuestionPlan questionPlan = createQuestionPlan();
        PlayerQuestion activeQuestion = createPlayerQuestion(
                PlayerQuestionStatus.ACTIVE,
                null
        );

        when(playerQuestionRepository.findFirstByRacePlayerAndStatusOrderByCreatedAtDesc(
                racePlayer,
                PlayerQuestionStatus.ACTIVE
        )).thenReturn(Optional.of(activeQuestion));

        ApiException exception = assertThrows(
                ApiException.class,
                () -> studentQuestionDeliveryService.getOrCreateCurrentQuestion(
                        racePlayer,
                        questionPlan
                )
        );

        assertEquals(ErrorCode.INVALID_QUESTION_TEMPLATE_CONFIG, exception.getErrorCode());
    }

    private QuestionPlan createQuestionPlan() {
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

    private InternalGeneratedQuestion createGeneratedQuestion() {
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

    private PlayerQuestion createPlayerQuestion(
            PlayerQuestionStatus status,
            LocalDateTime expiresAt
    ) {
        PlayerQuestion playerQuestion = new PlayerQuestion();
        playerQuestion.setQuestionTemplate(new QuestionTemplate());
        playerQuestion.setQuestionText("6 + 6 = ?");
        playerQuestion.setCorrectAnswerValue(12);
        playerQuestion.setTimeLimitSeconds(QuestionRules.DEFAULT_TIME_LIMIT_SECONDS);
        playerQuestion.setStatus(status);
        playerQuestion.setExpiresAt(expiresAt);

        return playerQuestion;
    }

    private List<PlayerQuestionChoice> createPlayerQuestionChoices(
            PlayerQuestion playerQuestion
    ) {
        PlayerQuestionChoice firstChoice = createPlayerQuestionChoice(
                playerQuestion,
                "12",
                12,
                true,
                1
        );
        PlayerQuestionChoice secondChoice = createPlayerQuestionChoice(
                playerQuestion,
                "10",
                10,
                false,
                2
        );

        return List.of(firstChoice, secondChoice);
    }

    private PlayerQuestionChoice createPlayerQuestionChoice(
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

    private StudentQuestionResponse createStudentQuestionResponse() {
        return new StudentQuestionResponse(
                1L,
                "6 + 6 = ?",
                QuestionRules.DEFAULT_TIME_LIMIT_SECONDS,
                now().plusSeconds(QuestionRules.DEFAULT_TIME_LIMIT_SECONDS),
                List.of(
                        new StudentQuestionChoiceResponse(1L, "12", 1),
                        new StudentQuestionChoiceResponse(2L, "10", 2)
                )
        );
    }

    private Subject createMathSubject() {
        Subject subject = new Subject();
        subject.setCode(QuestionRules.DEFAULT_SUBJECT_CODE);
        subject.setName("Math");
        subject.setActive(true);

        return subject;
    }

    private LocalDateTime now() {
        return LocalDateTime.ofInstant(FIXED_INSTANT, FIXED_ZONE);
    }
}
