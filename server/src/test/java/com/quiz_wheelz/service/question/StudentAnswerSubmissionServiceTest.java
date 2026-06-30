package com.quiz_wheelz.service.question;

import com.quiz_wheelz.dto.answer.SubmitAnswerRequest;
import com.quiz_wheelz.dto.answer.SubmitAnswerResponse;
import com.quiz_wheelz.entitys.PlayerQuestion;
import com.quiz_wheelz.entitys.PlayerQuestionChoice;
import com.quiz_wheelz.entitys.RacePlayer;
import com.quiz_wheelz.enums.PlayerQuestionStatus;
import com.quiz_wheelz.exception.ApiException;
import com.quiz_wheelz.exception.ErrorCode;
import com.quiz_wheelz.repository.PlayerQuestionChoiceRepository;
import com.quiz_wheelz.repository.PlayerQuestionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class StudentAnswerSubmissionServiceTest {

    private static final Instant FIXED_INSTANT = Instant.parse("2026-06-30T10:00:00Z");
    private static final ZoneId FIXED_ZONE = ZoneId.of("UTC");
    private static final long QUESTION_ID = 10L;
    private static final long CORRECT_CHOICE_ID = 101L;
    private static final long WRONG_CHOICE_ID = 102L;

    @Mock
    private PlayerQuestionRepository playerQuestionRepository;

    @Mock
    private PlayerQuestionChoiceRepository playerQuestionChoiceRepository;

    private StudentAnswerSubmissionService studentAnswerSubmissionService;

    @BeforeEach
    void setUp() {
        Clock fixedClock = Clock.fixed(FIXED_INSTANT, FIXED_ZONE);

        studentAnswerSubmissionService = new StudentAnswerSubmissionService(
                playerQuestionRepository,
                playerQuestionChoiceRepository,
                fixedClock
        );
    }

    @Test
    void shouldSubmitCorrectAnswerAndMarkQuestionAnswered() {
        RacePlayer racePlayer = new RacePlayer();
        PlayerQuestion question = createActiveQuestion(now().plusSeconds(30));
        PlayerQuestionChoice selectedChoice = createChoice(CORRECT_CHOICE_ID, true, question);
        SubmitAnswerRequest request = createRequest(QUESTION_ID, CORRECT_CHOICE_ID);

        when(playerQuestionRepository.findByIdAndRacePlayer(QUESTION_ID, racePlayer))
                .thenReturn(Optional.of(question));
        when(playerQuestionChoiceRepository.findByIdAndPlayerQuestion(CORRECT_CHOICE_ID, question))
                .thenReturn(Optional.of(selectedChoice));
        when(playerQuestionRepository.save(question)).thenReturn(question);

        SubmitAnswerResponse response = studentAnswerSubmissionService.submitAnswer(
                racePlayer,
                request
        );

        assertTrue(response.isCorrect());
        assertNull(response.getCorrectAnswerChoiceId());
        assertEquals(QUESTION_ID, response.getQuestionId());
        assertEquals(CORRECT_CHOICE_ID, response.getSelectedChoiceId());
        assertEquals(PlayerQuestionStatus.ANSWERED.name(), response.getQuestionStatus());
        assertEquals(PlayerQuestionStatus.ANSWERED, question.getStatus());
        assertEquals(now(), question.getAnsweredAt());
        assertEquals(now(), response.getAnsweredAt());
        assertEquals(question.getExpiresAt(), response.getExpiresAt());

        verify(playerQuestionRepository).save(question);
        verify(playerQuestionChoiceRepository, never())
                .findByPlayerQuestionOrderByDisplayOrderAsc(question);
    }

    @Test
    void shouldSubmitWrongAnswerAndReturnCorrectAnswerChoiceId() {
        RacePlayer racePlayer = new RacePlayer();
        PlayerQuestion question = createActiveQuestion(now().plusSeconds(30));
        PlayerQuestionChoice selectedChoice = createChoice(WRONG_CHOICE_ID, false, question);
        PlayerQuestionChoice correctChoice = createChoice(CORRECT_CHOICE_ID, true, question);
        SubmitAnswerRequest request = createRequest(QUESTION_ID, WRONG_CHOICE_ID);

        when(playerQuestionRepository.findByIdAndRacePlayer(QUESTION_ID, racePlayer))
                .thenReturn(Optional.of(question));
        when(playerQuestionChoiceRepository.findByIdAndPlayerQuestion(WRONG_CHOICE_ID, question))
                .thenReturn(Optional.of(selectedChoice));
        when(playerQuestionChoiceRepository.findByPlayerQuestionOrderByDisplayOrderAsc(question))
                .thenReturn(List.of(selectedChoice, correctChoice));
        when(playerQuestionRepository.save(question)).thenReturn(question);

        SubmitAnswerResponse response = studentAnswerSubmissionService.submitAnswer(
                racePlayer,
                request
        );

        assertFalse(response.isCorrect());
        assertEquals(CORRECT_CHOICE_ID, response.getCorrectAnswerChoiceId());
        assertEquals(WRONG_CHOICE_ID, response.getSelectedChoiceId());
        assertEquals(PlayerQuestionStatus.ANSWERED.name(), response.getQuestionStatus());
        assertEquals(PlayerQuestionStatus.ANSWERED, question.getStatus());
        assertEquals(now(), question.getAnsweredAt());

        verify(playerQuestionRepository).save(question);
    }

    @Test
    void shouldRejectMissingRacePlayer() {
        ApiException exception = assertThrows(
                ApiException.class,
                () -> studentAnswerSubmissionService.submitAnswer(
                        null,
                        createRequest(QUESTION_ID, CORRECT_CHOICE_ID)
                )
        );

        assertEquals(ErrorCode.INVALID_ANSWER_SUBMISSION, exception.getErrorCode());
    }

    @Test
    void shouldRejectMissingRequest() {
        ApiException exception = assertThrows(
                ApiException.class,
                () -> studentAnswerSubmissionService.submitAnswer(new RacePlayer(), null)
        );

        assertEquals(ErrorCode.INVALID_ANSWER_SUBMISSION, exception.getErrorCode());
    }

    @Test
    void shouldRejectMissingQuestionId() {
        ApiException exception = assertThrows(
                ApiException.class,
                () -> studentAnswerSubmissionService.submitAnswer(
                        new RacePlayer(),
                        createRequest(null, CORRECT_CHOICE_ID)
                )
        );

        assertEquals(ErrorCode.INVALID_ANSWER_SUBMISSION, exception.getErrorCode());
    }

    @Test
    void shouldRejectMissingChoiceId() {
        ApiException exception = assertThrows(
                ApiException.class,
                () -> studentAnswerSubmissionService.submitAnswer(
                        new RacePlayer(),
                        createRequest(QUESTION_ID, null)
                )
        );

        assertEquals(ErrorCode.INVALID_ANSWER_SUBMISSION, exception.getErrorCode());
    }

    @Test
    void shouldRejectQuestionThatDoesNotBelongToPlayer() {
        RacePlayer racePlayer = new RacePlayer();

        when(playerQuestionRepository.findByIdAndRacePlayer(QUESTION_ID, racePlayer))
                .thenReturn(Optional.empty());

        ApiException exception = assertThrows(
                ApiException.class,
                () -> studentAnswerSubmissionService.submitAnswer(
                        racePlayer,
                        createRequest(QUESTION_ID, CORRECT_CHOICE_ID)
                )
        );

        assertEquals(ErrorCode.QUESTION_NOT_FOUND_FOR_PLAYER, exception.getErrorCode());
    }

    @Test
    void shouldRejectQuestionThatIsNotActive() {
        RacePlayer racePlayer = new RacePlayer();
        PlayerQuestion question = createQuestion(PlayerQuestionStatus.ANSWERED, now().plusSeconds(30));

        when(playerQuestionRepository.findByIdAndRacePlayer(QUESTION_ID, racePlayer))
                .thenReturn(Optional.of(question));

        ApiException exception = assertThrows(
                ApiException.class,
                () -> studentAnswerSubmissionService.submitAnswer(
                        racePlayer,
                        createRequest(QUESTION_ID, CORRECT_CHOICE_ID)
                )
        );

        assertEquals(ErrorCode.QUESTION_NOT_ACTIVE, exception.getErrorCode());
        verify(playerQuestionChoiceRepository, never())
                .findByIdAndPlayerQuestion(CORRECT_CHOICE_ID, question);
    }

    @Test
    void shouldExpireQuestionWhenSubmittedAfterExpiration() {
        RacePlayer racePlayer = new RacePlayer();
        PlayerQuestion question = createActiveQuestion(now().minusSeconds(1));

        when(playerQuestionRepository.findByIdAndRacePlayer(QUESTION_ID, racePlayer))
                .thenReturn(Optional.of(question));
        when(playerQuestionRepository.save(question)).thenReturn(question);

        ApiException exception = assertThrows(
                ApiException.class,
                () -> studentAnswerSubmissionService.submitAnswer(
                        racePlayer,
                        createRequest(QUESTION_ID, CORRECT_CHOICE_ID)
                )
        );

        assertEquals(ErrorCode.QUESTION_EXPIRED, exception.getErrorCode());
        assertEquals(PlayerQuestionStatus.EXPIRED, question.getStatus());
        verify(playerQuestionRepository).save(question);
        verify(playerQuestionChoiceRepository, never())
                .findByIdAndPlayerQuestion(CORRECT_CHOICE_ID, question);
    }

    @Test
    void shouldTreatExpiresAtEqualNowAsExpired() {
        RacePlayer racePlayer = new RacePlayer();
        PlayerQuestion question = createActiveQuestion(now());

        when(playerQuestionRepository.findByIdAndRacePlayer(QUESTION_ID, racePlayer))
                .thenReturn(Optional.of(question));
        when(playerQuestionRepository.save(question)).thenReturn(question);

        ApiException exception = assertThrows(
                ApiException.class,
                () -> studentAnswerSubmissionService.submitAnswer(
                        racePlayer,
                        createRequest(QUESTION_ID, CORRECT_CHOICE_ID)
                )
        );

        assertEquals(ErrorCode.QUESTION_EXPIRED, exception.getErrorCode());
        assertEquals(PlayerQuestionStatus.EXPIRED, question.getStatus());
        verify(playerQuestionRepository).save(question);
    }

    @Test
    void shouldRejectChoiceThatDoesNotBelongToQuestion() {
        RacePlayer racePlayer = new RacePlayer();
        PlayerQuestion question = createActiveQuestion(now().plusSeconds(30));

        when(playerQuestionRepository.findByIdAndRacePlayer(QUESTION_ID, racePlayer))
                .thenReturn(Optional.of(question));
        when(playerQuestionChoiceRepository.findByIdAndPlayerQuestion(WRONG_CHOICE_ID, question))
                .thenReturn(Optional.empty());

        ApiException exception = assertThrows(
                ApiException.class,
                () -> studentAnswerSubmissionService.submitAnswer(
                        racePlayer,
                        createRequest(QUESTION_ID, WRONG_CHOICE_ID)
                )
        );

        assertEquals(ErrorCode.QUESTION_CHOICE_NOT_FOUND, exception.getErrorCode());
        verify(playerQuestionRepository, never()).save(question);
    }

    @Test
    void shouldNotRollbackApiExceptionSoExpiredQuestionStatusCanPersist()
            throws NoSuchMethodException {
        Transactional transactional = StudentAnswerSubmissionService.class
                .getMethod(
                        "submitAnswer",
                        RacePlayer.class,
                        SubmitAnswerRequest.class
                )
                .getAnnotation(Transactional.class);

        assertTrue(Arrays.asList(transactional.noRollbackFor()).contains(ApiException.class));
    }

    private SubmitAnswerRequest createRequest(Long questionId, Long choiceId) {
        SubmitAnswerRequest request = new SubmitAnswerRequest();
        request.setQuestionId(questionId);
        request.setChoiceId(choiceId);

        return request;
    }

    private PlayerQuestion createActiveQuestion(LocalDateTime expiresAt) {
        return createQuestion(PlayerQuestionStatus.ACTIVE, expiresAt);
    }

    private PlayerQuestion createQuestion(
            PlayerQuestionStatus status,
            LocalDateTime expiresAt
    ) {
        PlayerQuestion question = new PlayerQuestion();
        question.setId(QUESTION_ID);
        question.setStatus(status);
        question.setExpiresAt(expiresAt);

        return question;
    }

    private PlayerQuestionChoice createChoice(
            Long choiceId,
            boolean correct,
            PlayerQuestion question
    ) {
        PlayerQuestionChoice choice = new PlayerQuestionChoice();
        choice.setId(choiceId);
        choice.setPlayerQuestion(question);
        choice.setCorrect(correct);

        return choice;
    }

    private LocalDateTime now() {
        return LocalDateTime.ofInstant(FIXED_INSTANT, FIXED_ZONE);
    }
}
