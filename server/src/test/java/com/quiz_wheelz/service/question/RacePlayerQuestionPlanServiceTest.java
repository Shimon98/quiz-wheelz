package com.quiz_wheelz.service.question;

import com.quiz_wheelz.common.QuestionRules;
import com.quiz_wheelz.entitys.QuestionTemplate;
import com.quiz_wheelz.entitys.Race;
import com.quiz_wheelz.entitys.RacePlayer;
import com.quiz_wheelz.entitys.Subject;
import com.quiz_wheelz.enums.Difficulty;
import com.quiz_wheelz.enums.QuestionGenerationPattern;
import com.quiz_wheelz.enums.QuestionType;
import com.quiz_wheelz.exception.ApiException;
import com.quiz_wheelz.exception.ErrorCode;
import com.quiz_wheelz.repository.PlayerQuestionRepository;
import com.quiz_wheelz.repository.QuestionTemplateRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RacePlayerQuestionPlanServiceTest {

    @Mock
    private QuestionTemplateRepository questionTemplateRepository;

    @Mock
    private PlayerQuestionRepository playerQuestionRepository;

    @Test
    void shouldListRaceSubjectTemplatesAtRacePlayerDifficulty() {
        Subject subject = createMathSubject();
        RacePlayer racePlayer = createRacePlayer(subject, Difficulty.EASY);
        QuestionTemplate template = createTemplate(Difficulty.EASY, QuestionType.ADDITION);

        when(questionTemplateRepository.findBySubjectAndDifficultyAndActiveTrueOrderByIdAsc(
                subject,
                Difficulty.EASY
        )).thenReturn(List.of(template));
        when(playerQuestionRepository.countByRacePlayer(racePlayer)).thenReturn(0L);

        List<QuestionTemplate> result = createService().templatesInTurn(racePlayer);

        assertEquals(List.of(template), result);
    }

    @Test
    void shouldStartTheTurnByPlayerQuestionCountRotation() {
        Subject subject = createMathSubject();
        RacePlayer racePlayer = createRacePlayer(subject, Difficulty.EASY);
        QuestionTemplate firstTemplate = createTemplate(Difficulty.EASY, QuestionType.ADDITION);
        QuestionTemplate secondTemplate = createTemplate(Difficulty.EASY, QuestionType.SUBTRACTION);
        QuestionTemplate thirdTemplate = createTemplate(Difficulty.EASY, QuestionType.MULTIPLICATION);
        QuestionTemplate fourthTemplate = createTemplate(Difficulty.EASY, QuestionType.DIVISION);

        when(questionTemplateRepository.findBySubjectAndDifficultyAndActiveTrueOrderByIdAsc(
                subject,
                Difficulty.EASY
        )).thenReturn(List.of(firstTemplate, secondTemplate, thirdTemplate, fourthTemplate));
        when(playerQuestionRepository.countByRacePlayer(racePlayer)).thenReturn(2L);

        List<QuestionTemplate> result = createService().templatesInTurn(racePlayer);

        assertEquals(List.of(thirdTemplate, fourthTemplate, firstTemplate, secondTemplate), result);
    }

    @Test
    void shouldUseMediumDifficultyWhenRacePlayerDifficultyIsMedium() {
        Subject subject = createMathSubject();
        RacePlayer racePlayer = createRacePlayer(subject, Difficulty.MEDIUM);
        QuestionTemplate template = createTemplate(Difficulty.MEDIUM, QuestionType.MULTIPLICATION);

        when(questionTemplateRepository.findBySubjectAndDifficultyAndActiveTrueOrderByIdAsc(
                subject,
                Difficulty.MEDIUM
        )).thenReturn(List.of(template));
        when(playerQuestionRepository.countByRacePlayer(racePlayer)).thenReturn(0L);

        List<QuestionTemplate> result = createService().templatesInTurn(racePlayer);

        assertEquals(List.of(template), result);
    }

    @Test
    void shouldRejectMissingRacePlayer() {
        ApiException exception = assertThrows(
                ApiException.class,
                () -> createService().templatesInTurn(null)
        );

        assertEquals(ErrorCode.INVALID_QUESTION_TEMPLATE_CONFIG, exception.getErrorCode());
    }

    @Test
    void shouldRejectRacePlayerWithoutRace() {
        RacePlayer racePlayer = new RacePlayer();
        racePlayer.setCurrentDifficulty(Difficulty.EASY);

        ApiException exception = assertThrows(
                ApiException.class,
                () -> createService().templatesInTurn(racePlayer)
        );

        assertEquals(ErrorCode.INVALID_QUESTION_TEMPLATE_CONFIG, exception.getErrorCode());
    }

    @Test
    void shouldRejectRacePlayerWithoutSubject() {
        Race race = new Race();
        RacePlayer racePlayer = new RacePlayer();
        racePlayer.setRace(race);
        racePlayer.setCurrentDifficulty(Difficulty.EASY);

        ApiException exception = assertThrows(
                ApiException.class,
                () -> createService().templatesInTurn(racePlayer)
        );

        assertEquals(ErrorCode.INVALID_QUESTION_TEMPLATE_CONFIG, exception.getErrorCode());
    }

    @Test
    void shouldRejectRacePlayerWithoutCurrentDifficulty() {
        RacePlayer racePlayer = createRacePlayer(createMathSubject(), Difficulty.EASY);
        racePlayer.setCurrentDifficulty(null);

        ApiException exception = assertThrows(
                ApiException.class,
                () -> createService().templatesInTurn(racePlayer)
        );

        assertEquals(ErrorCode.INVALID_QUESTION_TEMPLATE_CONFIG, exception.getErrorCode());
    }

    @Test
    void shouldRejectWhenNoTemplateIsAvailableForPlayerState() {
        Subject subject = createMathSubject();
        RacePlayer racePlayer = createRacePlayer(subject, Difficulty.EASY);

        when(questionTemplateRepository.findBySubjectAndDifficultyAndActiveTrueOrderByIdAsc(
                subject,
                Difficulty.EASY
        )).thenReturn(List.of());

        ApiException exception = assertThrows(
                ApiException.class,
                () -> createService().templatesInTurn(racePlayer)
        );

        assertEquals(ErrorCode.QUESTION_TEMPLATE_NOT_AVAILABLE_FOR_PLAYER, exception.getErrorCode());
    }

    @Test
    void shouldLeaveInvalidTemplateInItsTurnForTheFallbackToSkip() {
        Subject subject = createMathSubject();
        RacePlayer racePlayer = createRacePlayer(subject, Difficulty.EASY);
        QuestionTemplate invalidTemplate = createTemplate(Difficulty.EASY, QuestionType.ADDITION);
        invalidTemplate.setType(null);

        when(questionTemplateRepository.findBySubjectAndDifficultyAndActiveTrueOrderByIdAsc(
                subject,
                Difficulty.EASY
        )).thenReturn(List.of(invalidTemplate));
        when(playerQuestionRepository.countByRacePlayer(racePlayer)).thenReturn(0L);

        assertEquals(List.of(invalidTemplate), createService().templatesInTurn(racePlayer));
    }

    private RacePlayerQuestionPlanService createService() {
        return new RacePlayerQuestionPlanService(
                questionTemplateRepository,
                playerQuestionRepository
        );
    }

    private RacePlayer createRacePlayer(Subject subject, Difficulty difficulty) {
        Race race = new Race();
        race.setSubject(subject);

        RacePlayer racePlayer = new RacePlayer();
        racePlayer.setRace(race);
        racePlayer.setCurrentDifficulty(difficulty);

        return racePlayer;
    }

    private QuestionTemplate createTemplate(
            Difficulty difficulty,
            QuestionType questionType
    ) {
        QuestionTemplate template = new QuestionTemplate();
        template.setSubject(createMathSubject());
        template.setType(questionType);
        template.setDifficulty(difficulty);
        template.setGenerationPattern(QuestionGenerationPattern.BINARY_OPERATION);
        template.setMinValue(1);
        template.setMaxValue(10);
        template.setTimeLimitSeconds(QuestionRules.DEFAULT_TIME_LIMIT_SECONDS);
        template.setChoicesCount(QuestionRules.DEFAULT_CHOICES_COUNT);
        template.setActive(true);

        return template;
    }

    private Subject createMathSubject() {
        Subject subject = new Subject();
        subject.setCode(QuestionRules.DEFAULT_SUBJECT_CODE);
        subject.setName("Math");
        subject.setActive(true);

        return subject;
    }
}
