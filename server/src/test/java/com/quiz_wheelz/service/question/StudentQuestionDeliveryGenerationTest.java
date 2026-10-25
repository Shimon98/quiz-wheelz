package com.quiz_wheelz.service.question;

import com.quiz_wheelz.common.QuestionRules;
import com.quiz_wheelz.dto.question.internal.InternalGeneratedQuestion;
import com.quiz_wheelz.dto.question.student.StudentQuestionResponse;
import com.quiz_wheelz.entitys.PlayerQuestion;
import com.quiz_wheelz.entitys.PlayerQuestionChoice;
import com.quiz_wheelz.entitys.QuestionTemplate;
import com.quiz_wheelz.entitys.RacePlayer;
import com.quiz_wheelz.enums.PlayerQuestionStatus;
import com.quiz_wheelz.enums.RacePlayerStatus;
import com.quiz_wheelz.enums.RaceStatus;
import com.quiz_wheelz.exception.ApiException;
import com.quiz_wheelz.exception.ErrorCode;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.dao.QueryTimeoutException;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.same;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class StudentQuestionDeliveryGenerationTest {

    private StudentQuestionDeliveryTestFixture fixture;

    @BeforeEach
    void setUp() {
        fixture = new StudentQuestionDeliveryTestFixture();
    }

    @Test
    void shouldGenerateAndPersistWhenNoActiveQuestionExists() {
        RacePlayer racePlayer = fixture.createRacePlayer();
        RacePlayer lockedRacePlayer = fixture.createRacePlayer();
        QuestionTemplate template = fixture.createTemplate();
        InternalGeneratedQuestion generated = fixture.createGeneratedQuestion();
        PlayerQuestion persisted = fixture.createPlayerQuestion(
                PlayerQuestionStatus.ACTIVE,
                fixture.now().plusSeconds(QuestionRules.DEFAULT_TIME_LIMIT_SECONDS)
        );
        List<PlayerQuestionChoice> choices = fixture.createPlayerQuestionChoices(persisted);
        StudentQuestionResponse expected = fixture.createStudentQuestionResponse();
        prepareGeneration(lockedRacePlayer, template, generated, persisted, choices, expected);

        StudentQuestionResponse result = fixture.studentQuestionDeliveryService
                .getOrCreateCurrentQuestion(racePlayer);

        assertSame(expected, result);
        verify(fixture.gameplayRequestGuard).requireGameplayAccess(
                lockedRacePlayer,
                StudentQuestionDeliveryTestFixture.FIXED_INSTANT
        );
        verify(fixture.questionGenerationService).generateFromTemplate(
                template,
                QuestionRules.DEFAULT_ADAPTIVE_MODE,
                QuestionRules.DEFAULT_ASSISTANCE_LEVEL
        );
        verify(fixture.playerQuestionPersistenceService)
                .persistGeneratedQuestion(lockedRacePlayer, generated);
    }

    @Test
    void shouldNeverTreatADatabaseOrUnrelatedFailureAsABrokenTemplate() {
        RacePlayer racePlayer = fixture.createRacePlayer();
        RacePlayer lockedRacePlayer = fixture.createRacePlayer();
        QuestionTemplate first = fixture.createTemplate();
        QuestionTemplate next = fixture.createTemplate();
        prepareGeneration(
                lockedRacePlayer,
                first,
                fixture.createGeneratedQuestion(),
                fixture.createPlayerQuestion(PlayerQuestionStatus.ACTIVE, fixture.now()),
                List.of(),
                fixture.createStudentQuestionResponse()
        );
        when(fixture.racePlayerQuestionPlanService.templatesInTurn(lockedRacePlayer))
                .thenReturn(List.of(first, next));
        when(fixture.questionGenerationService.generateFromTemplate(same(first), any(), any()))
                .thenThrow(new QueryTimeoutException("lock wait timeout"))
                .thenThrow(new ApiException(ErrorCode.RACE_PLAYER_NOT_FOUND));

        assertThrows(
                QueryTimeoutException.class,
                () -> fixture.studentQuestionDeliveryService.getOrCreateCurrentQuestion(racePlayer)
        );
        ApiException exception = assertThrows(
                ApiException.class,
                () -> fixture.studentQuestionDeliveryService.getOrCreateCurrentQuestion(racePlayer)
        );

        assertEquals(ErrorCode.RACE_PLAYER_NOT_FOUND, exception.getErrorCode());
        verify(fixture.questionGenerationService, never()).generateFromTemplate(same(next), any(), any());
        verify(fixture.playerQuestionPersistenceService, never()).persistGeneratedQuestion(any(), any());
    }

    @Test
    void shouldRejectPlayerThatFinishedWhileWaitingForLock() {
        RacePlayer requestPlayer = fixture.createRacePlayer();
        RacePlayer lockedPlayer = fixture.createRacePlayer(
                RacePlayerStatus.FINISHED,
                RaceStatus.IN_PROGRESS
        );
        prepareLockedPlayer(lockedPlayer);

        ApiException exception = assertThrows(
                ApiException.class,
                () -> fixture.studentQuestionDeliveryService
                        .getOrCreateCurrentQuestion(requestPlayer)
        );

        assertEquals(ErrorCode.RACE_PLAYER_NOT_RACING, exception.getErrorCode());
        verify(fixture.questionGenerationService, never()).generateFromTemplate(any(), any(), any());
    }

    @Test
    void shouldRejectPlayerWhoseRaceEndedWhileWaitingForLock() {
        RacePlayer requestPlayer = fixture.createRacePlayer();
        RacePlayer lockedPlayer = fixture.createRacePlayer(
                RacePlayerStatus.RACING,
                RaceStatus.FINISHED
        );
        prepareLockedPlayer(lockedPlayer);

        ApiException exception = assertThrows(
                ApiException.class,
                () -> fixture.studentQuestionDeliveryService
                        .getOrCreateCurrentQuestion(requestPlayer)
        );

        assertEquals(ErrorCode.RACE_NOT_IN_PROGRESS, exception.getErrorCode());
        verify(fixture.questionGenerationService, never()).generateFromTemplate(any(), any(), any());
    }

    @Test
    void shouldRejectExistingQuestionWithoutExpiry() {
        RacePlayer racePlayer = fixture.createRacePlayer();
        RacePlayer lockedRacePlayer = fixture.createRacePlayer();
        PlayerQuestion active = fixture.createPlayerQuestion(
                PlayerQuestionStatus.ACTIVE,
                null
        );
        prepareLockedPlayer(lockedRacePlayer);
        when(fixture.playerQuestionRepository
                .findFirstByRacePlayerAndStatusOrderByCreatedAtDesc(
                        lockedRacePlayer,
                        PlayerQuestionStatus.ACTIVE
                )).thenReturn(Optional.of(active));

        ApiException exception = assertThrows(
                ApiException.class,
                () -> fixture.studentQuestionDeliveryService
                        .getOrCreateCurrentQuestion(racePlayer)
        );

        assertEquals(ErrorCode.INVALID_QUESTION_TEMPLATE_CONFIG, exception.getErrorCode());
    }

    private void prepareGeneration(
            RacePlayer lockedRacePlayer,
            QuestionTemplate template,
            InternalGeneratedQuestion generated,
            PlayerQuestion persisted,
            List<PlayerQuestionChoice> choices,
            StudentQuestionResponse response
    ) {
        prepareLockedPlayer(lockedRacePlayer);
        when(fixture.playerQuestionRepository
                .findFirstByRacePlayerAndStatusOrderByCreatedAtDesc(
                        lockedRacePlayer,
                        PlayerQuestionStatus.ACTIVE
                )).thenReturn(Optional.empty());
        when(fixture.racePlayerQuestionPlanService.templatesInTurn(lockedRacePlayer))
                .thenReturn(List.of(template));
        when(fixture.questionGenerationService.generateFromTemplate(
                template,
                QuestionRules.DEFAULT_ADAPTIVE_MODE,
                QuestionRules.DEFAULT_ASSISTANCE_LEVEL
        )).thenReturn(generated);
        when(fixture.playerQuestionPersistenceService.persistGeneratedQuestion(
                lockedRacePlayer,
                generated
        )).thenReturn(persisted);
        when(fixture.playerQuestionChoiceRepository
                .findByPlayerQuestionOrderByDisplayOrderAsc(persisted))
                .thenReturn(choices);
        when(fixture.studentQuestionResponseMapper.toResponse(
                any(),
                any(),
                anyLong(),
                anyLong()
        )).thenReturn(response);
    }

    private void prepareLockedPlayer(RacePlayer lockedRacePlayer) {
        when(fixture.racePlayerRepository.findLockedByIdAndRaceId(
                StudentQuestionDeliveryTestFixture.RACE_PLAYER_ID,
                StudentQuestionDeliveryTestFixture.RACE_ID
        )).thenReturn(Optional.of(lockedRacePlayer));
    }
}
