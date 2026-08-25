package com.quiz_wheelz.service.liveevent;

import com.quiz_wheelz.dto.liveevent.PlayerFinishedLiveEventPayload;
import com.quiz_wheelz.dto.liveevent.PlayerJoinedLiveEventPayload;
import com.quiz_wheelz.dto.liveevent.PlayerProgressUpdatedLiveEventPayload;
import com.quiz_wheelz.dto.liveevent.QuestionAnsweredLiveEventPayload;
import com.quiz_wheelz.dto.liveevent.RaceFinishedLiveEventPayload;
import com.quiz_wheelz.dto.liveevent.RaceStartedLiveEventPayload;
import com.quiz_wheelz.dto.teacher.TeacherRaceLivePlayerResponse;
import com.quiz_wheelz.entitys.Race;
import com.quiz_wheelz.entitys.RacePlayer;
import com.quiz_wheelz.enums.RaceLiveEventType;
import com.quiz_wheelz.service.teacher.TeacherRaceLivePlayerSnapshotService;
import com.quiz_wheelz.utils.DateTimeUtils;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.util.List;
import java.util.Objects;

@Service
public class RaceLiveEventRecorder {

    private final RaceLiveEventService eventService;
    private final TeacherRaceLivePlayerSnapshotService playerSnapshotService;
    private final Clock clock;

    public RaceLiveEventRecorder(
            RaceLiveEventService eventService,
            TeacherRaceLivePlayerSnapshotService playerSnapshotService,
            Clock clock
    ) {
        this.eventService = Objects.requireNonNull(eventService);
        this.playerSnapshotService = Objects.requireNonNull(playerSnapshotService);
        this.clock = Objects.requireNonNull(clock);
    }

    public void recordPlayerJoined(RacePlayer racePlayer) {
        Race race = requiredRace(racePlayer);
        List<TeacherRaceLivePlayerResponse> players = orderedPlayers(race);
        eventService.record(
                race,
                RaceLiveEventType.PLAYER_JOINED,
                new PlayerJoinedLiveEventPayload(findPlayer(players, racePlayer.getId()))
        );
    }

    public void recordRaceStarted(Race race) {
        eventService.record(
                race,
                RaceLiveEventType.RACE_STARTED,
                new RaceStartedLiveEventPayload(
                        race.getStatus(),
                        DateTimeUtils.toEpochMilli(race.getStartedAt(), clock.getZone()),
                        orderedPlayers(race)
                )
        );
    }

    public void recordQuestionAnswered(
            RacePlayer racePlayer,
            Long questionId,
            boolean correct
    ) {
        eventService.record(
                requiredRace(racePlayer),
                RaceLiveEventType.QUESTION_ANSWERED,
                new QuestionAnsweredLiveEventPayload(
                        racePlayer.getId(),
                        questionId,
                        correct
                )
        );
    }

    public void recordPlayerProgressUpdated(Race race) {
        eventService.record(
                race,
                RaceLiveEventType.PLAYER_PROGRESS_UPDATED,
                new PlayerProgressUpdatedLiveEventPayload(orderedPlayers(race))
        );
    }

    public void recordPlayerFinished(RacePlayer racePlayer) {
        Race race = requiredRace(racePlayer);
        List<TeacherRaceLivePlayerResponse> players = orderedPlayers(race);
        eventService.record(
                race,
                RaceLiveEventType.PLAYER_FINISHED,
                new PlayerFinishedLiveEventPayload(
                        findPlayer(players, racePlayer.getId()),
                        DateTimeUtils.toEpochMilli(
                                racePlayer.getFinishedAt(),
                                clock.getZone()
                        ),
                        players
                )
        );
    }

    public void recordRaceFinished(Race race) {
        eventService.record(
                race,
                RaceLiveEventType.RACE_FINISHED,
                new RaceFinishedLiveEventPayload(
                        race.getStatus(),
                        DateTimeUtils.toEpochMilli(race.getFinishedAt(), clock.getZone()),
                        orderedPlayers(race)
                )
        );
    }

    private List<TeacherRaceLivePlayerResponse> orderedPlayers(Race race) {
        return playerSnapshotService.getOrderedPlayers(Objects.requireNonNull(race));
    }

    private TeacherRaceLivePlayerResponse findPlayer(
            List<TeacherRaceLivePlayerResponse> players,
            Long racePlayerId
    ) {
        return players.stream()
                .filter(player -> Objects.equals(player.getRacePlayerId(), racePlayerId))
                .findFirst()
                .orElseThrow(IllegalStateException::new);
    }

    private Race requiredRace(RacePlayer racePlayer) {
        return Objects.requireNonNull(Objects.requireNonNull(racePlayer).getRace());
    }
}
