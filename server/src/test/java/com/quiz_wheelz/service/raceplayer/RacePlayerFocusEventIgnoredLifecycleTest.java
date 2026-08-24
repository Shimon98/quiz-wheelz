package com.quiz_wheelz.service.raceplayer;

import com.quiz_wheelz.dto.raceplayer.RacePlayerFocusEventResponse;
import com.quiz_wheelz.entitys.PlayerQuestion;
import com.quiz_wheelz.entitys.RacePlayer;
import com.quiz_wheelz.entitys.RacePlayerFocusEvent;
import com.quiz_wheelz.enums.Difficulty;
import com.quiz_wheelz.enums.PlayerQuestionStatus;
import com.quiz_wheelz.enums.RaceFocusPolicy;
import com.quiz_wheelz.enums.RacePlayerFocusEventOutcome;
import com.quiz_wheelz.enums.RacePlayerFocusEventType;
import com.quiz_wheelz.enums.RacePlayerFocusState;
import com.quiz_wheelz.enums.RacePlayerStatus;
import com.quiz_wheelz.enums.RaceStatus;
import com.quiz_wheelz.repository.PlayerQuestionRepository;
import com.quiz_wheelz.repository.RacePlayerFocusEventRepository;
import com.quiz_wheelz.service.question.QuestionTimeoutService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.lang.reflect.Modifier;
import java.time.Clock;
import java.util.Arrays;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

class RacePlayerFocusEventIgnoredLifecycleTest {

    private RacePlayerFocusEventTestFixture fixture;

    @BeforeEach
    void setUp() {
        fixture = new RacePlayerFocusEventTestFixture();
    }

    @Test
    void waitingPlayerHiddenEventIsIgnored() {
        RacePlayer racePlayer = fixture.prepareNewEvent(
                RacePlayerStatus.WAITING,
                RaceStatus.READY
        );

        assertIgnoredWithoutGameplayEffects(racePlayer, null);

        verifyNoInteractions(fixture.playerQuestionRepository);
    }

    @Test
    void finishedPlayerHiddenEventIsIgnored() {
        RacePlayer racePlayer = fixture.prepareNewEvent(
                RacePlayerStatus.FINISHED,
                RaceStatus.IN_PROGRESS
        );

        assertIgnoredWithoutGameplayEffects(racePlayer, null);

        verifyNoInteractions(fixture.playerQuestionRepository);
    }

    @Test
    void disconnectedPlayerHiddenEventIsIgnored() {
        RacePlayer racePlayer = fixture.prepareNewEvent(
                RacePlayerStatus.DISCONNECTED,
                RaceStatus.IN_PROGRESS
        );

        assertIgnoredWithoutGameplayEffects(racePlayer, null);

        verifyNoInteractions(fixture.playerQuestionRepository);
    }

    @Test
    void finishedRaceHiddenEventIsIgnored() {
        RacePlayer racePlayer = fixture.prepareNewEvent(
                RacePlayerStatus.RACING,
                RaceStatus.FINISHED
        );

        assertIgnoredWithoutGameplayEffects(racePlayer, null);

        verifyNoInteractions(fixture.playerQuestionRepository);
    }

    @Test
    void missingActiveQuestionHiddenEventIsIgnored() {
        RacePlayer racePlayer = fixture.prepareNewEvent(
                RacePlayerStatus.RACING,
                RaceStatus.IN_PROGRESS
        );
        when(fixture.playerQuestionRepository
                .findFirstByRacePlayerAndStatusOrderByCreatedAtDesc(
                        racePlayer,
                        PlayerQuestionStatus.ACTIVE
                )).thenReturn(Optional.empty());

        assertIgnoredWithoutGameplayEffects(racePlayer, null);

        verify(fixture.focusEventRepository, never())
                .countByRacePlayerAndPlayerQuestionAndCountedFocusLossTrue(any(), any());
    }

    @Test
    void expiredActiveQuestionHiddenEventIsIgnoredWithoutExpiringQuestion() {
        RacePlayer racePlayer = fixture.prepareNewEvent(
                RacePlayerStatus.RACING,
                RaceStatus.IN_PROGRESS
        );
        PlayerQuestion question = fixture.createQuestion(
                RacePlayerFocusEventTestFixture.QUESTION_ID,
                fixture.now().minusSeconds(1)
        );
        when(fixture.playerQuestionRepository
                .findFirstByRacePlayerAndStatusOrderByCreatedAtDesc(
                        racePlayer,
                        PlayerQuestionStatus.ACTIVE
                )).thenReturn(Optional.of(question));

        assertIgnoredWithoutGameplayEffects(racePlayer, question);

        assertEquals(PlayerQuestionStatus.ACTIVE, question.getStatus());
        assertNull(question.getAnsweredAt());
        verify(fixture.playerQuestionRepository, never()).save(any());
        verify(fixture.focusEventRepository, never())
                .countByRacePlayerAndPlayerQuestionAndCountedFocusLossTrue(any(), any());
    }

    @Test
    void focusServiceUsesOnlySessionPersistenceCutoffAndTimeoutOwners() {
        Set<Class<?>> dependencyTypes = Arrays.stream(
                        RacePlayerFocusEventService.class.getDeclaredFields()
                )
                .filter(field -> !Modifier.isStatic(field.getModifiers()))
                .map(java.lang.reflect.Field::getType)
                .collect(Collectors.toSet());

        assertEquals(
                Set.of(
                        RacePlayerSessionLockService.class,
                        RacePlayerFocusEventRepository.class,
                        PlayerQuestionRepository.class,
                        RacePlayerGameplayPresenceService.class,
                        QuestionTimeoutService.class,
                        Clock.class
                ),
                dependencyTypes
        );
    }

    private void assertIgnoredWithoutGameplayEffects(
            RacePlayer racePlayer,
            PlayerQuestion question
    ) {
        racePlayer.getRace().setFocusPolicy(RaceFocusPolicy.STRICT);
        RacePlayerFocusEventResponse response = fixture.service.recordFocusEvent(
                fixture.httpRequest,
                fixture.request(
                        RacePlayerFocusEventTestFixture.EVENT_ID,
                        RacePlayerFocusEventType.TAB_HIDDEN
                )
        );

        assertEquals(RacePlayerFocusEventOutcome.IGNORED, response.getOutcome());
        assertEquals(0, response.getFocusLossCount());
        assertEquals(0, response.getQuestionFocusLossCount());
        assertNull(response.getActiveQuestionId());
        assertEquals(RacePlayerFocusState.VISIBLE, racePlayer.getFocusState());
        assertEquals(0, racePlayer.getFocusLossCount());
        assertNull(racePlayer.getLastFocusLossAt());
        assertEquals(50, racePlayer.getScore());
        assertEquals(120.0, racePlayer.getPosition());
        assertEquals(1.2, racePlayer.getSpeed());
        assertEquals(3, racePlayer.getStreak());
        assertEquals(Difficulty.EASY, racePlayer.getCurrentDifficulty());

        ArgumentCaptor<RacePlayerFocusEvent> captor =
                ArgumentCaptor.forClass(RacePlayerFocusEvent.class);
        verify(fixture.focusEventRepository).save(captor.capture());
        assertFalse(captor.getValue().getCountedFocusLoss());
        assertNull(captor.getValue().getPlayerQuestion());

        if (question != null) {
            assertEquals(PlayerQuestionStatus.ACTIVE, question.getStatus());
        }
    }
}
