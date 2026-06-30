package com.quiz_wheelz.service.question;

import com.quiz_wheelz.common.QuestionRules;
import com.quiz_wheelz.dto.question.internal.InternalGeneratedQuestion;
import com.quiz_wheelz.dto.question.internal.InternalGeneratedQuestionChoice;
import com.quiz_wheelz.entitys.PlayerQuestion;
import com.quiz_wheelz.entitys.PlayerQuestionChoice;
import com.quiz_wheelz.entitys.QuestionTemplate;
import com.quiz_wheelz.entitys.RacePlayer;
import com.quiz_wheelz.entitys.Subject;
import com.quiz_wheelz.enums.Difficulty;
import com.quiz_wheelz.enums.PlayerQuestionStatus;
import com.quiz_wheelz.enums.QuestionType;
import com.quiz_wheelz.exception.ApiException;
import com.quiz_wheelz.exception.ErrorCode;
import com.quiz_wheelz.repository.PlayerQuestionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PlayerQuestionPersistenceServiceTest {

    private static final Instant FIXED_INSTANT = Instant.parse("2026-06-30T10:00:00Z");
    private static final ZoneId FIXED_ZONE = ZoneId.of("UTC");

    @Mock
    private PlayerQuestionRepository playerQuestionRepository;

    private PlayerQuestionPersistenceService playerQuestionPersistenceService;

    @BeforeEach
    void setUp() {
        Clock fixedClock = Clock.fixed(FIXED_INSTANT, FIXED_ZONE);
        playerQuestionPersistenceService = new PlayerQuestionPersistenceService(
                playerQuestionRepository,
                fixedClock
        );
    }

    @Test
    void shouldPersistGeneratedQuestionForRacePlayer() {
        RacePlayer racePlayer = new RacePlayer();
        QuestionTemplate questionTemplate = new QuestionTemplate();
        InternalGeneratedQuestion generatedQuestion = createGeneratedQuestion(questionTemplate);

        when(playerQuestionRepository.save(any(PlayerQuestion.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        PlayerQuestion result = playerQuestionPersistenceService.persistGeneratedQuestion(
                racePlayer,
                generatedQuestion
        );

        assertSame(racePlayer, result.getRacePlayer());
        assertSame(questionTemplate, result.getQuestionTemplate());
        assertEquals("6 + 6 = ?", result.getQuestionText());
        assertEquals(12, result.getCorrectAnswerValue());
        assertEquals(QuestionRules.DEFAULT_TIME_LIMIT_SECONDS, result.getTimeLimitSeconds());
        assertEquals(PlayerQuestionStatus.ACTIVE, result.getStatus());
        assertEquals(expectedExpiresAt(), result.getExpiresAt());
    }

    @Test
    void shouldPersistGeneratedQuestionChoices() {
        RacePlayer racePlayer = new RacePlayer();
        InternalGeneratedQuestion generatedQuestion = createGeneratedQuestion(new QuestionTemplate());

        when(playerQuestionRepository.save(any(PlayerQuestion.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        PlayerQuestion result = playerQuestionPersistenceService.persistGeneratedQuestion(
                racePlayer,
                generatedQuestion
        );

        assertEquals(4, result.getChoices().size());

        PlayerQuestionChoice firstChoice = result.getChoices().getFirst();

        assertSame(result, firstChoice.getPlayerQuestion());
        assertEquals("12", firstChoice.getChoiceText());
        assertEquals(12, firstChoice.getAnswerValue());
        assertTrue(firstChoice.isCorrect());
        assertEquals(1, firstChoice.getDisplayOrder());
    }

    @Test
    void shouldSavePlayerQuestionThroughRepository() {
        RacePlayer racePlayer = new RacePlayer();
        InternalGeneratedQuestion generatedQuestion = createGeneratedQuestion(new QuestionTemplate());

        when(playerQuestionRepository.save(any(PlayerQuestion.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        playerQuestionPersistenceService.persistGeneratedQuestion(
                racePlayer,
                generatedQuestion
        );

        ArgumentCaptor<PlayerQuestion> captor = ArgumentCaptor.forClass(PlayerQuestion.class);

        verify(playerQuestionRepository).save(captor.capture());

        PlayerQuestion savedQuestion = captor.getValue();

        assertSame(racePlayer, savedQuestion.getRacePlayer());
        assertEquals(PlayerQuestionStatus.ACTIVE, savedQuestion.getStatus());
        assertEquals(4, savedQuestion.getChoices().size());
    }

    @Test
    void shouldRejectMissingRacePlayer() {
        InternalGeneratedQuestion generatedQuestion = createGeneratedQuestion(new QuestionTemplate());

        ApiException exception = assertThrows(
                ApiException.class,
                () -> playerQuestionPersistenceService.persistGeneratedQuestion(
                        null,
                        generatedQuestion
                )
        );

        assertEquals(ErrorCode.INVALID_QUESTION_TEMPLATE_CONFIG, exception.getErrorCode());
    }

    @Test
    void shouldRejectMissingGeneratedQuestion() {
        ApiException exception = assertThrows(
                ApiException.class,
                () -> playerQuestionPersistenceService.persistGeneratedQuestion(
                        new RacePlayer(),
                        null
                )
        );

        assertEquals(ErrorCode.INVALID_QUESTION_TEMPLATE_CONFIG, exception.getErrorCode());
    }

    @Test
    void shouldRejectGeneratedQuestionWithoutChoices() {
        InternalGeneratedQuestion generatedQuestion = new InternalGeneratedQuestion(
                createMathSubject(),
                new QuestionTemplate(),
                QuestionType.ADDITION,
                Difficulty.EASY,
                "6 + 6 = ?",
                12,
                QuestionRules.DEFAULT_TIME_LIMIT_SECONDS,
                List.of()
        );

        ApiException exception = assertThrows(
                ApiException.class,
                () -> playerQuestionPersistenceService.persistGeneratedQuestion(
                        new RacePlayer(),
                        generatedQuestion
                )
        );

        assertEquals(ErrorCode.INVALID_QUESTION_TEMPLATE_CONFIG, exception.getErrorCode());
    }

    @Test
    void shouldRejectGeneratedChoiceWithoutAnswerValue() {
        InternalGeneratedQuestion generatedQuestion = new InternalGeneratedQuestion(
                createMathSubject(),
                new QuestionTemplate(),
                QuestionType.ADDITION,
                Difficulty.EASY,
                "6 + 6 = ?",
                12,
                QuestionRules.DEFAULT_TIME_LIMIT_SECONDS,
                List.of(new InternalGeneratedQuestionChoice("12", null, true, 1))
        );

        ApiException exception = assertThrows(
                ApiException.class,
                () -> playerQuestionPersistenceService.persistGeneratedQuestion(
                        new RacePlayer(),
                        generatedQuestion
                )
        );

        assertEquals(ErrorCode.INVALID_QUESTION_TEMPLATE_CONFIG, exception.getErrorCode());
    }

    private InternalGeneratedQuestion createGeneratedQuestion(
            QuestionTemplate questionTemplate
    ) {
        return new InternalGeneratedQuestion(
                createMathSubject(),
                questionTemplate,
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

    private Subject createMathSubject() {
        Subject subject = new Subject();
        subject.setCode(QuestionRules.DEFAULT_SUBJECT_CODE);
        subject.setName("Math");
        subject.setActive(true);

        return subject;
    }

    private LocalDateTime expectedExpiresAt() {
        return LocalDateTime.ofInstant(FIXED_INSTANT, FIXED_ZONE)
                .plusSeconds(QuestionRules.DEFAULT_TIME_LIMIT_SECONDS);
    }
}
