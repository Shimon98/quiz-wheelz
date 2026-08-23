package com.quiz_wheelz.service.question;

import com.quiz_wheelz.dto.answer.SubmitAnswerRequest;
import com.quiz_wheelz.entitys.PlayerQuestion;
import com.quiz_wheelz.entitys.RacePlayer;
import com.quiz_wheelz.enums.PlayerQuestionStatus;
import com.quiz_wheelz.exception.ApiException;
import com.quiz_wheelz.exception.ErrorCode;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class StudentAnswerSubmissionValidationTest {

    private StudentAnswerSubmissionTestFixture fixture;

    @BeforeEach
    void setUp() {
        fixture = new StudentAnswerSubmissionTestFixture();
    }

    @Test
    void shouldRejectMissingPlayerOrRequest() {
        assertInvalidSubmission(
                null,
                fixture.createRequest(
                        StudentAnswerSubmissionTestFixture.QUESTION_ID,
                        StudentAnswerSubmissionTestFixture.CORRECT_CHOICE_ID
                )
        );
        assertInvalidSubmission(fixture.createRacePlayer(), null);
    }

    @Test
    void shouldRejectMissingQuestionOrChoiceId() {
        assertInvalidSubmission(
                fixture.createRacePlayer(),
                fixture.createRequest(
                        null,
                        StudentAnswerSubmissionTestFixture.CORRECT_CHOICE_ID
                )
        );
        assertInvalidSubmission(
                fixture.createRacePlayer(),
                fixture.createRequest(
                        StudentAnswerSubmissionTestFixture.QUESTION_ID,
                        null
                )
        );
    }

    @Test
    void shouldRejectPlayerWithoutIdentity() {
        assertInvalidSubmission(
                new RacePlayer(),
                fixture.createRequest(
                        StudentAnswerSubmissionTestFixture.QUESTION_ID,
                        StudentAnswerSubmissionTestFixture.CORRECT_CHOICE_ID
                )
        );
    }

    @Test
    void shouldRejectPlayerThatCannotBeLocked() {
        RacePlayer racePlayer = fixture.createRacePlayer();
        when(fixture.racePlayerRepository.findLockedByIdAndRaceId(
                StudentAnswerSubmissionTestFixture.RACE_PLAYER_ID,
                StudentAnswerSubmissionTestFixture.RACE_ID
        )).thenReturn(Optional.empty());

        ApiException exception = submitAndCapture(
                racePlayer,
                StudentAnswerSubmissionTestFixture.CORRECT_CHOICE_ID
        );

        assertEquals(ErrorCode.RACE_PLAYER_NOT_FOUND, exception.getErrorCode());
        verify(fixture.playerQuestionRepository, never())
                .findLockedByIdAndRacePlayer(any(), any());
    }

    @Test
    void shouldRejectQuestionThatDoesNotBelongToPlayer() {
        RacePlayer racePlayer = fixture.createRacePlayer();
        RacePlayer lockedRacePlayer = fixture.mockLockedRacePlayer(racePlayer);
        when(fixture.playerQuestionRepository.findLockedByIdAndRacePlayer(
                StudentAnswerSubmissionTestFixture.QUESTION_ID,
                lockedRacePlayer
        )).thenReturn(Optional.empty());

        ApiException exception = submitAndCapture(
                racePlayer,
                StudentAnswerSubmissionTestFixture.CORRECT_CHOICE_ID
        );

        assertEquals(ErrorCode.QUESTION_NOT_FOUND_FOR_PLAYER, exception.getErrorCode());
        verify(fixture.gameplayRequestGuard, never()).requireGameplayAccess(any(), any());
    }

    @Test
    void shouldRejectQuestionThatIsNotActive() {
        RacePlayer racePlayer = fixture.createRacePlayer();
        RacePlayer lockedRacePlayer = fixture.mockLockedRacePlayer(racePlayer);
        PlayerQuestion question = fixture.createQuestion(
                PlayerQuestionStatus.ANSWERED,
                fixture.now().plusSeconds(30)
        );
        when(fixture.playerQuestionRepository.findLockedByIdAndRacePlayer(
                StudentAnswerSubmissionTestFixture.QUESTION_ID,
                lockedRacePlayer
        )).thenReturn(Optional.of(question));

        ApiException exception = submitAndCapture(
                racePlayer,
                StudentAnswerSubmissionTestFixture.CORRECT_CHOICE_ID
        );

        assertEquals(ErrorCode.QUESTION_NOT_ACTIVE, exception.getErrorCode());
        verify(fixture.gameplayRequestGuard, never()).requireGameplayAccess(any(), any());
        verify(fixture.playerQuestionChoiceRepository, never())
                .findByIdAndPlayerQuestion(any(), any());
    }

    @Test
    void shouldRejectChoiceThatDoesNotBelongToQuestion() {
        RacePlayer racePlayer = fixture.createRacePlayer();
        RacePlayer lockedRacePlayer = fixture.mockLockedRacePlayer(racePlayer);
        PlayerQuestion question = fixture.createActiveQuestion(
                fixture.now().plusSeconds(30)
        );
        when(fixture.playerQuestionRepository.findLockedByIdAndRacePlayer(
                StudentAnswerSubmissionTestFixture.QUESTION_ID,
                lockedRacePlayer
        )).thenReturn(Optional.of(question));
        when(fixture.playerQuestionChoiceRepository.findByIdAndPlayerQuestion(
                StudentAnswerSubmissionTestFixture.WRONG_CHOICE_ID,
                question
        )).thenReturn(Optional.empty());

        ApiException exception = submitAndCapture(
                racePlayer,
                StudentAnswerSubmissionTestFixture.WRONG_CHOICE_ID
        );

        assertEquals(ErrorCode.QUESTION_CHOICE_NOT_FOUND, exception.getErrorCode());
        verify(fixture.gameplayRequestGuard).requireGameplayAccess(
                lockedRacePlayer,
                StudentAnswerSubmissionTestFixture.FIXED_INSTANT
        );
        verify(fixture.playerQuestionRepository, never()).save(question);
        verify(fixture.raceEngineService, never()).applyAnswerResult(any(), anyBoolean());
    }

    @Test
    void shouldRejectGameplayWhenGuardRequiresReconnect() {
        RacePlayer racePlayer = fixture.createRacePlayer();
        RacePlayer lockedRacePlayer = fixture.mockLockedRacePlayer(racePlayer);
        PlayerQuestion question = fixture.createActiveQuestion(
                fixture.now().plusSeconds(30)
        );
        when(fixture.playerQuestionRepository.findLockedByIdAndRacePlayer(
                StudentAnswerSubmissionTestFixture.QUESTION_ID,
                lockedRacePlayer
        )).thenReturn(Optional.of(question));
        doThrow(new ApiException(ErrorCode.RACE_PLAYER_RECONNECT_REQUIRED))
                .when(fixture.gameplayRequestGuard)
                .requireGameplayAccess(
                        lockedRacePlayer,
                        StudentAnswerSubmissionTestFixture.FIXED_INSTANT
                );

        ApiException exception = submitAndCapture(
                racePlayer,
                StudentAnswerSubmissionTestFixture.CORRECT_CHOICE_ID
        );

        assertEquals(ErrorCode.RACE_PLAYER_RECONNECT_REQUIRED, exception.getErrorCode());
        verify(fixture.playerQuestionChoiceRepository, never())
                .findByIdAndPlayerQuestion(any(), any());
    }

    private void assertInvalidSubmission(
            RacePlayer racePlayer,
            SubmitAnswerRequest request
    ) {
        ApiException exception = assertThrows(
                ApiException.class,
                () -> fixture.studentAnswerSubmissionService.submitAnswer(
                        racePlayer,
                        request
                )
        );
        assertEquals(ErrorCode.INVALID_ANSWER_SUBMISSION, exception.getErrorCode());
        verify(fixture.raceEngineService, never()).applyAnswerResult(any(), anyBoolean());
    }

    private ApiException submitAndCapture(RacePlayer racePlayer, long choiceId) {
        return assertThrows(
                ApiException.class,
                () -> fixture.studentAnswerSubmissionService.submitAnswer(
                        racePlayer,
                        fixture.createRequest(
                                StudentAnswerSubmissionTestFixture.QUESTION_ID,
                                choiceId
                        )
                )
        );
    }
}
