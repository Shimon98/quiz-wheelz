package com.quiz_wheelz.service.liveevent;

import com.quiz_wheelz.entitys.Race;
import com.quiz_wheelz.entitys.RacePlayer;
import com.quiz_wheelz.enums.RacePlayerStatus;
import com.quiz_wheelz.enums.RaceStatus;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Objects;

@Service
public class RaceLiveEventChangeRecorder {

    private final RaceLiveEventRecorder eventRecorder;

    public RaceLiveEventChangeRecorder(RaceLiveEventRecorder eventRecorder) {
        this.eventRecorder = Objects.requireNonNull(eventRecorder);
    }

    public PlayerLiveState capturePlayer(RacePlayer racePlayer) {
        Objects.requireNonNull(racePlayer);
        return new PlayerLiveState(
                racePlayer.getPosition(),
                racePlayer.getSpeed(),
                racePlayer.getScore(),
                racePlayer.getStreak(),
                racePlayer.getStatus(),
                racePlayer.getFinishedAt()
        );
    }

    public RaceLiveState captureRace(Race race) {
        Objects.requireNonNull(race);
        return new RaceLiveState(race.getStatus(), race.getFinishedAt());
    }

    public void recordPlayerChange(PlayerLiveState before, RacePlayer racePlayer) {
        Objects.requireNonNull(before);
        Objects.requireNonNull(racePlayer);
        PlayerLiveState after = capturePlayer(racePlayer);

        if (before.status() != RacePlayerStatus.FINISHED
                && after.status() == RacePlayerStatus.FINISHED) {
            eventRecorder.recordPlayerFinished(racePlayer);
        } else if (!before.equals(after)) {
            eventRecorder.recordPlayerProgressUpdated(
                    Objects.requireNonNull(racePlayer.getRace())
            );
        }
    }

    public void recordRaceChange(RaceLiveState before, Race race) {
        Objects.requireNonNull(before);
        Objects.requireNonNull(race);
        RaceLiveState after = captureRace(race);

        if (before.status() != RaceStatus.FINISHED
                && after.status() == RaceStatus.FINISHED) {
            eventRecorder.recordRaceFinished(race);
        }
    }

    public record PlayerLiveState(
            Double position,
            Double speed,
            Integer score,
            Integer streak,
            RacePlayerStatus status,
            LocalDateTime finishedAt
    ) {
    }

    public record RaceLiveState(
            RaceStatus status,
            LocalDateTime finishedAt
    ) {
    }
}
