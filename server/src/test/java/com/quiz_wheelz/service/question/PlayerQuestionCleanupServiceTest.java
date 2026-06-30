package com.quiz_wheelz.service.question;

import com.quiz_wheelz.common.PlayerQuestionCleanupRules;
import com.quiz_wheelz.entitys.PlayerQuestion;
import com.quiz_wheelz.enums.PlayerQuestionStatus;
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
import java.util.Collection;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PlayerQuestionCleanupServiceTest {

    private static final Instant FIXED_INSTANT = Instant.parse("2026-06-30T10:00:00Z");
    private static final ZoneId FIXED_ZONE = ZoneId.of("UTC");

    @Mock
    private PlayerQuestionRepository playerQuestionRepository;

    private PlayerQuestionCleanupService playerQuestionCleanupService;

    @BeforeEach
    void setUp() {
        Clock fixedClock = Clock.fixed(FIXED_INSTANT, FIXED_ZONE);

        playerQuestionCleanupService = new PlayerQuestionCleanupService(
                playerQuestionRepository,
                fixedClock
        );
    }

    @Test
    void shouldDeleteOnlyAnsweredAndExpiredQuestionsOlderThanRetention() {
        PlayerQuestion answeredQuestion = createQuestion(PlayerQuestionStatus.ANSWERED);
        PlayerQuestion expiredQuestion = createQuestion(PlayerQuestionStatus.EXPIRED);

        when(playerQuestionRepository.findByStatusInAndUpdatedAtBefore(
                anyCollection(),
                any(LocalDateTime.class)
        )).thenReturn(List.of(answeredQuestion, expiredQuestion));

        long deletedCount = playerQuestionCleanupService.cleanupOldInactiveQuestions();

        assertEquals(2L, deletedCount);

        @SuppressWarnings("unchecked")
        ArgumentCaptor<Collection<PlayerQuestionStatus>> statusesCaptor =
                ArgumentCaptor.forClass(Collection.class);

        ArgumentCaptor<LocalDateTime> cutoffCaptor =
                ArgumentCaptor.forClass(LocalDateTime.class);

        verify(playerQuestionRepository).findByStatusInAndUpdatedAtBefore(
                statusesCaptor.capture(),
                cutoffCaptor.capture()
        );

        assertTrue(statusesCaptor.getValue().contains(PlayerQuestionStatus.ANSWERED));
        assertTrue(statusesCaptor.getValue().contains(PlayerQuestionStatus.EXPIRED));
        assertEquals(2, statusesCaptor.getValue().size());

        verify(playerQuestionRepository).deleteAll(
                List.of(answeredQuestion, expiredQuestion)
        );
    }

    @Test
    void shouldUseRetentionDaysFromRules() {
        when(playerQuestionRepository.findByStatusInAndUpdatedAtBefore(
                anyCollection(),
                any(LocalDateTime.class)
        )).thenReturn(List.of());

        playerQuestionCleanupService.cleanupOldInactiveQuestions();

        ArgumentCaptor<LocalDateTime> cutoffCaptor =
                ArgumentCaptor.forClass(LocalDateTime.class);

        verify(playerQuestionRepository).findByStatusInAndUpdatedAtBefore(
                anyCollection(),
                cutoffCaptor.capture()
        );

        LocalDateTime expectedCutoff = LocalDateTime.ofInstant(FIXED_INSTANT, FIXED_ZONE)
                .minusDays(PlayerQuestionCleanupRules.RETENTION_DAYS);

        assertEquals(expectedCutoff, cutoffCaptor.getValue());
    }

    @Test
    void shouldReturnZeroAndNotDeleteWhenNoQuestionsMatch() {
        when(playerQuestionRepository.findByStatusInAndUpdatedAtBefore(
                anyCollection(),
                any(LocalDateTime.class)
        )).thenReturn(List.of());

        long deletedCount = playerQuestionCleanupService.cleanupOldInactiveQuestions();

        assertEquals(0L, deletedCount);
        verify(playerQuestionRepository, never()).deleteAll(anyCollection());
    }

    @Test
    void shouldRunScheduledCleanupWithoutThrowing() {
        when(playerQuestionRepository.findByStatusInAndUpdatedAtBefore(
                anyCollection(),
                any(LocalDateTime.class)
        )).thenReturn(List.of());

        playerQuestionCleanupService.runScheduledCleanup();

        verify(playerQuestionRepository).findByStatusInAndUpdatedAtBefore(
                anyCollection(),
                any(LocalDateTime.class)
        );
    }

    private PlayerQuestion createQuestion(PlayerQuestionStatus status) {
        PlayerQuestion playerQuestion = new PlayerQuestion();
        playerQuestion.setStatus(status);

        return playerQuestion;
    }
}
