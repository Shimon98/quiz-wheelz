package com.quiz_wheelz.service.raceplayer;

import com.quiz_wheelz.dto.raceplayer.RacePlayerFocusEventRequest;
import com.quiz_wheelz.entitys.PlayerQuestion;
import com.quiz_wheelz.entitys.Race;
import com.quiz_wheelz.entitys.RacePlayer;
import com.quiz_wheelz.enums.Difficulty;
import com.quiz_wheelz.enums.PlayerQuestionStatus;
import com.quiz_wheelz.enums.RacePlayerFocusEventType;
import com.quiz_wheelz.enums.RacePlayerStatus;
import com.quiz_wheelz.enums.RaceStatus;
import com.quiz_wheelz.repository.PlayerQuestionRepository;
import com.quiz_wheelz.repository.RacePlayerFocusEventRepository;
import jakarta.servlet.http.HttpServletRequest;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Optional;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

final class RacePlayerFocusEventTestFixture {

    static final Instant NOW = Instant.parse("2026-08-23T17:00:00Z");
    static final ZoneId ZONE = ZoneId.of("UTC");
    static final UUID EVENT_ID = UUID.fromString("550e8400-e29b-41d4-a716-446655440000");
    static final UUID SECOND_EVENT_ID = UUID.fromString("550e8400-e29b-41d4-a716-446655440001");
    static final UUID THIRD_EVENT_ID = UUID.fromString("550e8400-e29b-41d4-a716-446655440002");
    static final long RACE_ID = 3L;
    static final long RACE_PLAYER_ID = 17L;
    static final long QUESTION_ID = 42L;

    final RacePlayerSessionLockService sessionLockService =
            mock(RacePlayerSessionLockService.class);
    final RacePlayerFocusEventRepository focusEventRepository =
            mock(RacePlayerFocusEventRepository.class);
    final PlayerQuestionRepository playerQuestionRepository =
            mock(PlayerQuestionRepository.class);
    final HttpServletRequest httpRequest = mock(HttpServletRequest.class);
    final RacePlayerFocusEventService service = new RacePlayerFocusEventService(
            sessionLockService,
            focusEventRepository,
            playerQuestionRepository,
            Clock.fixed(NOW, ZONE)
    );

    RacePlayer prepareNewEvent(RacePlayerStatus playerStatus, RaceStatus raceStatus) {
        RacePlayer racePlayer = createRacePlayer(playerStatus, raceStatus);
        when(sessionLockService.resolveAndLock(httpRequest)).thenReturn(racePlayer);
        when(focusEventRepository.findByRacePlayerAndClientEventId(any(), any()))
                .thenReturn(Optional.empty());
        when(focusEventRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        return racePlayer;
    }

    PlayerQuestion prepareActiveQuestion(RacePlayer racePlayer) {
        PlayerQuestion question = createQuestion(
                QUESTION_ID,
                now().plusSeconds(30)
        );
        when(playerQuestionRepository
                .findFirstByRacePlayerAndStatusOrderByCreatedAtDesc(
                        racePlayer,
                        PlayerQuestionStatus.ACTIVE
                )).thenReturn(Optional.of(question));
        return question;
    }

    RacePlayer createRacePlayer(RacePlayerStatus playerStatus, RaceStatus raceStatus) {
        Race race = new Race();
        race.setId(RACE_ID);
        race.setStatus(raceStatus);
        race.setTotalDistance(1000);

        RacePlayer racePlayer = new RacePlayer();
        racePlayer.setId(RACE_PLAYER_ID);
        racePlayer.setRace(race);
        racePlayer.setStatus(playerStatus);
        racePlayer.setCurrentDifficulty(Difficulty.EASY);
        racePlayer.setScore(50);
        racePlayer.setPosition(120.0);
        racePlayer.setSpeed(1.2);
        racePlayer.setStreak(3);
        racePlayer.setHighestStreak(5);
        return racePlayer;
    }

    PlayerQuestion createQuestion(long id, LocalDateTime expiresAt) {
        PlayerQuestion question = new PlayerQuestion();
        question.setId(id);
        question.setStatus(PlayerQuestionStatus.ACTIVE);
        question.setExpiresAt(expiresAt);
        return question;
    }

    RacePlayerFocusEventRequest request(UUID eventId, RacePlayerFocusEventType type) {
        RacePlayerFocusEventRequest request = new RacePlayerFocusEventRequest();
        request.setEventId(eventId);
        request.setType(type);
        return request;
    }

    LocalDateTime now() {
        return LocalDateTime.ofInstant(NOW, ZONE);
    }
}
