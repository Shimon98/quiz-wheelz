package com.quiz_wheelz.service.question;

import com.quiz_wheelz.entitys.PlayerQuestion;
import com.quiz_wheelz.entitys.PlayerQuestionChoice;
import com.quiz_wheelz.entitys.RacePlayer;
import com.quiz_wheelz.enums.RacePlayerStatus;
import com.quiz_wheelz.enums.RaceStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InOrder;

import java.util.List;
import java.util.Optional;

import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.verifyNoMoreInteractions;
import static org.mockito.Mockito.when;

class StudentAnswerLiveEventTest {

    private StudentAnswerSubmissionTestFixture fixture;

    @BeforeEach
    void setUp() {
        fixture = new StudentAnswerSubmissionTestFixture();
    }

    @Test
    void normalAnswerOrdersQuestionBeforeProgress() {
        RacePlayer player = prepareSuccessfulAnswer();
        doAnswer(invocation -> {
            player.setPosition(10.0);
            return fixture.createRaceImpact(player, true);
        }).when(fixture.raceEngineService).applyAnswerResult(player, true);

        submit(player);

        InOrder mutationOrder = inOrder(
                fixture.racePlayerRepository,
                fixture.liveMutationGate,
                fixture.playerQuestionRepository
        );
        mutationOrder.verify(fixture.racePlayerRepository)
                .findLockedByIdAndRaceId(
                        StudentAnswerSubmissionTestFixture.RACE_PLAYER_ID,
                        StudentAnswerSubmissionTestFixture.RACE_ID
                );
        mutationOrder.verify(fixture.liveMutationGate).lockIfActive(player);
        mutationOrder.verify(fixture.playerQuestionRepository)
                .findLockedByIdAndRacePlayer(
                        StudentAnswerSubmissionTestFixture.QUESTION_ID,
                        player
                );

        InOrder order = inOrder(fixture.liveEventRecorder);
        order.verify(fixture.liveEventRecorder).recordQuestionAnswered(
                player,
                StudentAnswerSubmissionTestFixture.QUESTION_ID,
                true
        );
        order.verify(fixture.liveEventRecorder).recordPlayerProgressUpdated(player.getRace());
        verifyNoMoreInteractions(fixture.liveEventRecorder);
    }

    @Test
    void finishingAnswerOrdersQuestionBeforePlayerFinish() {
        RacePlayer player = prepareSuccessfulAnswer();
        doAnswer(invocation -> {
            player.setStatus(RacePlayerStatus.FINISHED);
            player.setFinishedAt(fixture.now());
            return fixture.createFinishedRaceImpact(player);
        }).when(fixture.raceEngineService).applyAnswerResult(player, true);

        submit(player);

        InOrder order = inOrder(fixture.liveEventRecorder);
        order.verify(fixture.liveEventRecorder).recordQuestionAnswered(
                player,
                StudentAnswerSubmissionTestFixture.QUESTION_ID,
                true
        );
        order.verify(fixture.liveEventRecorder).recordPlayerFinished(player);
        verifyNoMoreInteractions(fixture.liveEventRecorder);
    }

    @Test
    void raceFinishingAnswerOrdersQuestionPlayerFinishThenRaceFinish() {
        RacePlayer player = prepareSuccessfulAnswer();
        doAnswer(invocation -> {
            player.setStatus(RacePlayerStatus.FINISHED);
            player.setFinishedAt(fixture.now());
            player.getRace().setStatus(RaceStatus.FINISHED);
            player.getRace().setFinishedAt(fixture.now());
            return fixture.createFinishedRaceImpact(player);
        }).when(fixture.raceEngineService).applyAnswerResult(player, true);

        submit(player);

        InOrder order = inOrder(fixture.liveEventRecorder);
        order.verify(fixture.liveEventRecorder).recordQuestionAnswered(
                player,
                StudentAnswerSubmissionTestFixture.QUESTION_ID,
                true
        );
        order.verify(fixture.liveEventRecorder).recordPlayerFinished(player);
        order.verify(fixture.liveEventRecorder).recordRaceFinished(player.getRace());
        verifyNoMoreInteractions(fixture.liveEventRecorder);
    }

    private RacePlayer prepareSuccessfulAnswer() {
        RacePlayer requestPlayer = fixture.createRacePlayer();
        RacePlayer player = fixture.mockLockedRacePlayer(requestPlayer);
        PlayerQuestion question = fixture.createActiveQuestion(fixture.now().plusSeconds(30));
        PlayerQuestionChoice choice = fixture.createChoice(
                StudentAnswerSubmissionTestFixture.CORRECT_CHOICE_ID,
                true,
                question
        );
        when(fixture.playerQuestionRepository.findLockedByIdAndRacePlayer(
                StudentAnswerSubmissionTestFixture.QUESTION_ID,
                player
        )).thenReturn(Optional.of(question));
        when(fixture.playerQuestionChoiceRepository.findByIdAndPlayerQuestion(
                StudentAnswerSubmissionTestFixture.CORRECT_CHOICE_ID,
                question
        )).thenReturn(Optional.of(choice));
        when(fixture.playerQuestionRepository.save(question)).thenReturn(question);
        when(fixture.racePlayerRepository.findByRaceOrderByLaneNumberAsc(player.getRace()))
                .thenReturn(List.of(player));
        return player;
    }

    private void submit(RacePlayer player) {
        RacePlayer requestPlayer = fixture.createRacePlayer();
        when(fixture.racePlayerRepository.findLockedByIdAndRaceId(
                requestPlayer.getId(),
                requestPlayer.getRace().getId()
        )).thenReturn(Optional.of(player));
        fixture.studentAnswerSubmissionService.submitAnswer(
                requestPlayer,
                fixture.createRequest(
                        StudentAnswerSubmissionTestFixture.QUESTION_ID,
                        StudentAnswerSubmissionTestFixture.CORRECT_CHOICE_ID
                )
        );
    }
}
