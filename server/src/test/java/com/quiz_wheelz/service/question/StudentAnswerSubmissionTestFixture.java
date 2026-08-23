package com.quiz_wheelz.service.question;

import com.quiz_wheelz.dto.answer.SubmitAnswerRequest;
import com.quiz_wheelz.dto.raceengine.AnswerRaceImpact;
import com.quiz_wheelz.entitys.PlayerQuestion;
import com.quiz_wheelz.entitys.PlayerQuestionChoice;
import com.quiz_wheelz.entitys.Race;
import com.quiz_wheelz.entitys.RacePlayer;
import com.quiz_wheelz.enums.Difficulty;
import com.quiz_wheelz.enums.PlayerQuestionStatus;
import com.quiz_wheelz.enums.RacePlayerStatus;
import com.quiz_wheelz.enums.RaceStatus;
import com.quiz_wheelz.repository.PlayerQuestionChoiceRepository;
import com.quiz_wheelz.repository.PlayerQuestionRepository;
import com.quiz_wheelz.repository.RacePlayerRepository;
import com.quiz_wheelz.service.raceengine.RaceEngineService;
import com.quiz_wheelz.service.raceplayer.RacePlayerGameplayRequestGuard;
import com.quiz_wheelz.service.raceplayer.StudentRaceRuntimeSnapshotMapper;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Optional;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

final class StudentAnswerSubmissionTestFixture {

    static final Instant FIXED_INSTANT = Instant.parse("2026-06-30T10:00:00Z");
    static final ZoneId FIXED_ZONE = ZoneId.of("UTC");
    static final long RACE_ID = 1L;
    static final long RACE_PLAYER_ID = 7L;
    static final long QUESTION_ID = 10L;
    static final long CORRECT_CHOICE_ID = 101L;
    static final long WRONG_CHOICE_ID = 102L;

    final PlayerQuestionRepository playerQuestionRepository = mock(PlayerQuestionRepository.class);
    final PlayerQuestionChoiceRepository playerQuestionChoiceRepository =
            mock(PlayerQuestionChoiceRepository.class);
    final RacePlayerRepository racePlayerRepository = mock(RacePlayerRepository.class);
    final RaceEngineService raceEngineService = mock(RaceEngineService.class);
    final RacePlayerGameplayRequestGuard gameplayRequestGuard =
            mock(RacePlayerGameplayRequestGuard.class);
    final StudentAnswerSubmissionService studentAnswerSubmissionService =
            new StudentAnswerSubmissionService(
                    playerQuestionRepository,
                    playerQuestionChoiceRepository,
                    racePlayerRepository,
                    raceEngineService,
                    gameplayRequestGuard,
                    new StudentRaceRuntimeSnapshotMapper(),
                    Clock.fixed(FIXED_INSTANT, FIXED_ZONE)
            );

    SubmitAnswerRequest createRequest(Long questionId, Long choiceId) {
        SubmitAnswerRequest request = new SubmitAnswerRequest();
        request.setQuestionId(questionId);
        request.setChoiceId(choiceId);
        return request;
    }

    RacePlayer createRacePlayer() {
        Race race = new Race();
        race.setId(RACE_ID);
        race.setStatus(RaceStatus.IN_PROGRESS);
        race.setTotalDistance(1000);

        RacePlayer racePlayer = new RacePlayer();
        racePlayer.setId(RACE_PLAYER_ID);
        racePlayer.setRace(race);
        racePlayer.setStatus(RacePlayerStatus.RACING);
        racePlayer.setCurrentDifficulty(Difficulty.EASY);
        racePlayer.setPosition(0.0);
        racePlayer.setSpeed(1.0);
        racePlayer.setScore(0);
        racePlayer.setStreak(0);
        racePlayer.setHighestStreak(0);
        racePlayer.setCorrectAnswers(0);
        racePlayer.setWrongAnswers(0);
        racePlayer.setDifficultyCorrectStreak(0);
        racePlayer.setDifficultyWrongStreak(0);
        return racePlayer;
    }

    RacePlayer mockLockedRacePlayer(RacePlayer requestRacePlayer) {
        RacePlayer lockedRacePlayer = createRacePlayer();
        when(racePlayerRepository.findLockedByIdAndRaceId(
                requestRacePlayer.getId(),
                requestRacePlayer.getRace().getId()
        )).thenReturn(Optional.of(lockedRacePlayer));
        return lockedRacePlayer;
    }

    AnswerRaceImpact createRaceImpact(RacePlayer racePlayer, boolean correct) {
        return new AnswerRaceImpact(
                RACE_ID,
                RACE_PLAYER_ID,
                correct,
                correct ? 10 : 0,
                correct ? 10.0 : 0.0,
                correct ? 10 : 0,
                correct ? 10.0 : 0.0,
                correct ? 1.2 : 0.8,
                correct ? 1 : 0,
                correct ? 1 : 0,
                correct ? 1 : 0,
                correct ? 0 : 1,
                Difficulty.EASY,
                racePlayer.getCurrentDifficulty(),
                racePlayer.getDifficultyCorrectStreak(),
                racePlayer.getDifficultyWrongStreak(),
                false,
                RacePlayerStatus.RACING,
                RaceStatus.IN_PROGRESS,
                false,
                false
        );
    }

    PlayerQuestion createActiveQuestion(LocalDateTime expiresAt) {
        return createQuestion(PlayerQuestionStatus.ACTIVE, expiresAt);
    }

    PlayerQuestion createQuestion(PlayerQuestionStatus status, LocalDateTime expiresAt) {
        PlayerQuestion question = new PlayerQuestion();
        question.setId(QUESTION_ID);
        question.setStatus(status);
        question.setExpiresAt(expiresAt);
        return question;
    }

    PlayerQuestionChoice createChoice(
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

    LocalDateTime now() {
        return LocalDateTime.ofInstant(FIXED_INSTANT, FIXED_ZONE);
    }

    long epochOf(LocalDateTime localDateTime) {
        return localDateTime.atZone(FIXED_ZONE).toInstant().toEpochMilli();
    }
}
