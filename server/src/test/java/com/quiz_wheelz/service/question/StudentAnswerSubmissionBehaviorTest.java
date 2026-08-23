package com.quiz_wheelz.service.question;

import com.quiz_wheelz.dto.answer.SubmitAnswerRequest;
import com.quiz_wheelz.dto.answer.SubmitAnswerResponse;
import com.quiz_wheelz.dto.raceengine.AnswerRaceImpact;
import com.quiz_wheelz.entitys.PlayerQuestion;
import com.quiz_wheelz.entitys.PlayerQuestionChoice;
import com.quiz_wheelz.entitys.RacePlayer;
import com.quiz_wheelz.enums.Difficulty;
import com.quiz_wheelz.enums.PlayerQuestionStatus;
import com.quiz_wheelz.enums.RacePlayerStatus;
import com.quiz_wheelz.enums.RaceStatus;
import com.quiz_wheelz.exception.ApiException;
import com.quiz_wheelz.exception.ErrorCode;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class StudentAnswerSubmissionBehaviorTest {

    private StudentAnswerSubmissionTestFixture fixture;

    @BeforeEach
    void setUp() {
        fixture = new StudentAnswerSubmissionTestFixture();
    }

    @Test
    void shouldSubmitCorrectAnswerAndMarkQuestionAnswered() {
        RacePlayer racePlayer = fixture.createRacePlayer();
        RacePlayer lockedRacePlayer = fixture.mockLockedRacePlayer(racePlayer);
        PlayerQuestion question = fixture.createActiveQuestion(
                fixture.now().plusSeconds(30)
        );
        PlayerQuestionChoice choice = fixture.createChoice(
                StudentAnswerSubmissionTestFixture.CORRECT_CHOICE_ID,
                true,
                question
        );
        AnswerRaceImpact impact = fixture.createRaceImpact(lockedRacePlayer, true);
        prepareAnswer(lockedRacePlayer, question, choice, impact, true);

        SubmitAnswerResponse response = fixture.studentAnswerSubmissionService.submitAnswer(
                racePlayer,
                fixture.createRequest(
                        StudentAnswerSubmissionTestFixture.QUESTION_ID,
                        StudentAnswerSubmissionTestFixture.CORRECT_CHOICE_ID
                )
        );

        assertTrue(response.isCorrect());
        assertNull(response.getCorrectAnswerChoiceId());
        assertEquals(PlayerQuestionStatus.ANSWERED, question.getStatus());
        assertEquals(fixture.now(), question.getAnsweredAt());
        assertEquals(fixture.epochOf(fixture.now()), response.getAnsweredAtEpochMs());
        assertNotNull(response.getRaceImpact());
        assertEquals(10, response.getRaceImpact().getScoreDelta());
        assertEquals(10.0, response.getRaceImpact().getProgressDelta());
        assertEquals(1000, response.getRaceImpact().getSnapshot().getTotalDistance());
        assertEquals(Difficulty.EASY,
                response.getRaceImpact().getSnapshot().getCurrentDifficulty());
        assertEquals(RacePlayerStatus.RACING,
                response.getRaceImpact().getSnapshot().getPlayerStatus());
        assertEquals(RaceStatus.IN_PROGRESS,
                response.getRaceImpact().getSnapshot().getRaceStatus());
        assertFalse(response.getRaceImpact().getSnapshot().isPlayerFinished());
        verify(fixture.gameplayRequestGuard).requireGameplayAccess(
                lockedRacePlayer,
                StudentAnswerSubmissionTestFixture.FIXED_INSTANT
        );
        verify(fixture.playerQuestionRepository).save(question);
        verify(fixture.playerQuestionChoiceRepository, never())
                .findByPlayerQuestionOrderByDisplayOrderAsc(question);
    }

    @Test
    void shouldNotApplyAnswerWhenSettlementFinishesPlayerFirst() {
        RacePlayer racePlayer = fixture.createRacePlayer();
        RacePlayer lockedRacePlayer = fixture.mockLockedRacePlayer(racePlayer);
        PlayerQuestion question = fixture.createActiveQuestion(
                fixture.now().plusSeconds(30)
        );
        when(fixture.playerQuestionRepository.findLockedByIdAndRacePlayer(
                StudentAnswerSubmissionTestFixture.QUESTION_ID,
                lockedRacePlayer
        )).thenReturn(Optional.of(question));
        doAnswer(invocation -> {
            lockedRacePlayer.setStatus(RacePlayerStatus.FINISHED);
            return null;
        }).when(fixture.gameplayRequestGuard).requireGameplayAccess(any(), any());

        ApiException exception = assertThrows(
                ApiException.class,
                () -> fixture.studentAnswerSubmissionService.submitAnswer(
                        racePlayer,
                        fixture.createRequest(
                                StudentAnswerSubmissionTestFixture.QUESTION_ID,
                                StudentAnswerSubmissionTestFixture.CORRECT_CHOICE_ID
                        )
                )
        );

        assertEquals(ErrorCode.RACE_PLAYER_NOT_RACING, exception.getErrorCode());
        verify(fixture.raceEngineService, never()).applyAnswerResult(any(), anyBoolean());
        verify(fixture.playerQuestionRepository, never()).save(question);
    }

    @Test
    void shouldSubmitWrongAnswerAndReturnCorrectChoiceId() {
        RacePlayer racePlayer = fixture.createRacePlayer();
        RacePlayer lockedRacePlayer = fixture.mockLockedRacePlayer(racePlayer);
        PlayerQuestion question = fixture.createActiveQuestion(
                fixture.now().plusSeconds(30)
        );
        PlayerQuestionChoice selected = fixture.createChoice(
                StudentAnswerSubmissionTestFixture.WRONG_CHOICE_ID,
                false,
                question
        );
        PlayerQuestionChoice correct = fixture.createChoice(
                StudentAnswerSubmissionTestFixture.CORRECT_CHOICE_ID,
                true,
                question
        );
        AnswerRaceImpact impact = fixture.createRaceImpact(lockedRacePlayer, false);
        prepareAnswer(lockedRacePlayer, question, selected, impact, false);
        when(fixture.playerQuestionChoiceRepository
                .findByPlayerQuestionOrderByDisplayOrderAsc(question))
                .thenReturn(List.of(selected, correct));

        SubmitAnswerResponse response = fixture.studentAnswerSubmissionService.submitAnswer(
                racePlayer,
                fixture.createRequest(
                        StudentAnswerSubmissionTestFixture.QUESTION_ID,
                        StudentAnswerSubmissionTestFixture.WRONG_CHOICE_ID
                )
        );

        assertFalse(response.isCorrect());
        assertEquals(
                StudentAnswerSubmissionTestFixture.CORRECT_CHOICE_ID,
                response.getCorrectAnswerChoiceId()
        );
        assertEquals(PlayerQuestionStatus.ANSWERED, question.getStatus());
        verify(fixture.raceEngineService).applyAnswerResult(lockedRacePlayer, false);
    }

    @Test
    void shouldRejectWhenGuardReturnsWithExpiredQuestion() {
        RacePlayer racePlayer = fixture.createRacePlayer();
        RacePlayer lockedRacePlayer = fixture.mockLockedRacePlayer(racePlayer);
        PlayerQuestion question = fixture.createActiveQuestion(
                fixture.now().minusSeconds(1)
        );
        when(fixture.playerQuestionRepository.findLockedByIdAndRacePlayer(
                StudentAnswerSubmissionTestFixture.QUESTION_ID,
                lockedRacePlayer
        )).thenReturn(Optional.of(question));
        doAnswer(invocation -> {
            question.setStatus(PlayerQuestionStatus.EXPIRED);
            return null;
        }).when(fixture.gameplayRequestGuard).requireGameplayAccess(any(), any());

        ApiException exception = assertThrows(
                ApiException.class,
                () -> fixture.studentAnswerSubmissionService.submitAnswer(
                        racePlayer,
                        fixture.createRequest(
                                StudentAnswerSubmissionTestFixture.QUESTION_ID,
                                StudentAnswerSubmissionTestFixture.CORRECT_CHOICE_ID
                        )
                )
        );

        assertEquals(ErrorCode.QUESTION_EXPIRED, exception.getErrorCode());
        verify(fixture.raceEngineService, never()).applyAnswerResult(any(), anyBoolean());
    }

    @Test
    void shouldNotMarkAnsweredWhenRaceEngineRejectsImpact() {
        RacePlayer racePlayer = fixture.createRacePlayer();
        RacePlayer lockedRacePlayer = fixture.mockLockedRacePlayer(racePlayer);
        PlayerQuestion question = fixture.createActiveQuestion(
                fixture.now().plusSeconds(30)
        );
        PlayerQuestionChoice choice = fixture.createChoice(
                StudentAnswerSubmissionTestFixture.CORRECT_CHOICE_ID,
                true,
                question
        );
        when(fixture.playerQuestionRepository.findLockedByIdAndRacePlayer(
                StudentAnswerSubmissionTestFixture.QUESTION_ID,
                lockedRacePlayer
        )).thenReturn(Optional.of(question));
        when(fixture.playerQuestionChoiceRepository.findByIdAndPlayerQuestion(
                StudentAnswerSubmissionTestFixture.CORRECT_CHOICE_ID,
                question
        )).thenReturn(Optional.of(choice));
        when(fixture.raceEngineService.applyAnswerResult(lockedRacePlayer, true))
                .thenThrow(new ApiException(ErrorCode.RACE_NOT_IN_PROGRESS));

        ApiException exception = assertThrows(
                ApiException.class,
                () -> fixture.studentAnswerSubmissionService.submitAnswer(
                        racePlayer,
                        fixture.createRequest(
                                StudentAnswerSubmissionTestFixture.QUESTION_ID,
                                StudentAnswerSubmissionTestFixture.CORRECT_CHOICE_ID
                        )
                )
        );

        assertEquals(ErrorCode.RACE_NOT_IN_PROGRESS, exception.getErrorCode());
        assertEquals(PlayerQuestionStatus.ACTIVE, question.getStatus());
        assertNull(question.getAnsweredAt());
        verify(fixture.playerQuestionRepository, never()).save(question);
    }

    @Test
    void shouldNotApplyRaceEngineTwiceForSameQuestion() {
        RacePlayer racePlayer = fixture.createRacePlayer();
        RacePlayer lockedRacePlayer = fixture.createRacePlayer();
        PlayerQuestion question = fixture.createActiveQuestion(
                fixture.now().plusSeconds(30)
        );
        PlayerQuestionChoice choice = fixture.createChoice(
                StudentAnswerSubmissionTestFixture.CORRECT_CHOICE_ID,
                true,
                question
        );
        AnswerRaceImpact impact = fixture.createRaceImpact(lockedRacePlayer, true);
        when(fixture.racePlayerRepository.findLockedByIdAndRaceId(
                StudentAnswerSubmissionTestFixture.RACE_PLAYER_ID,
                StudentAnswerSubmissionTestFixture.RACE_ID
        )).thenReturn(Optional.of(lockedRacePlayer));
        prepareAnswer(lockedRacePlayer, question, choice, impact, true);

        fixture.studentAnswerSubmissionService.submitAnswer(
                racePlayer,
                fixture.createRequest(
                        StudentAnswerSubmissionTestFixture.QUESTION_ID,
                        StudentAnswerSubmissionTestFixture.CORRECT_CHOICE_ID
                )
        );
        ApiException second = assertThrows(
                ApiException.class,
                () -> fixture.studentAnswerSubmissionService.submitAnswer(
                        racePlayer,
                        fixture.createRequest(
                                StudentAnswerSubmissionTestFixture.QUESTION_ID,
                                StudentAnswerSubmissionTestFixture.CORRECT_CHOICE_ID
                        )
                )
        );

        assertEquals(ErrorCode.QUESTION_NOT_ACTIVE, second.getErrorCode());
        verify(fixture.raceEngineService, times(1))
                .applyAnswerResult(lockedRacePlayer, true);
    }

    @Test
    void apiExceptionShouldNotRollBackSettlementState() throws NoSuchMethodException {
        Transactional transactional = StudentAnswerSubmissionService.class
                .getMethod("submitAnswer", RacePlayer.class, SubmitAnswerRequest.class)
                .getAnnotation(Transactional.class);

        assertTrue(Arrays.asList(transactional.noRollbackFor()).contains(ApiException.class));
    }

    private void prepareAnswer(
            RacePlayer lockedRacePlayer,
            PlayerQuestion question,
            PlayerQuestionChoice selectedChoice,
            AnswerRaceImpact impact,
            boolean correct
    ) {
        when(fixture.playerQuestionRepository.findLockedByIdAndRacePlayer(
                StudentAnswerSubmissionTestFixture.QUESTION_ID,
                lockedRacePlayer
        )).thenReturn(Optional.of(question));
        when(fixture.playerQuestionChoiceRepository.findByIdAndPlayerQuestion(
                selectedChoice.getId(),
                question
        )).thenReturn(Optional.of(selectedChoice));
        when(fixture.raceEngineService.applyAnswerResult(lockedRacePlayer, correct))
                .thenReturn(impact);
        when(fixture.playerQuestionRepository.save(question)).thenReturn(question);
    }
}
