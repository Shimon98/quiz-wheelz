package com.quiz_wheelz.service.liveevent;

import com.quiz_wheelz.entitys.Race;
import com.quiz_wheelz.entitys.RacePlayer;
import com.quiz_wheelz.enums.RacePlayerStatus;
import com.quiz_wheelz.enums.RaceStatus;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
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
        recordPlayerChange(resolvePlayerChange(before, racePlayer), racePlayer);
    }

    public void recordFinalizationPlayerChanges(
            Race race,
            List<PlayerChange> changes
    ) {
        Objects.requireNonNull(race);
        Objects.requireNonNull(changes);
        List<RacePlayer> finishedPlayers = new ArrayList<>();
        boolean progressChanged = false;

        for (PlayerChange change : changes) {
            Objects.requireNonNull(change);
            RacePlayer racePlayer = change.racePlayer();
            PlayerChangeType type = resolvePlayerChange(change.before(), racePlayer);
            if (type == PlayerChangeType.FINISHED) {
                finishedPlayers.add(racePlayer);
            } else if (type == PlayerChangeType.PROGRESS) {
                progressChanged = true;
            }
        }

        finishedPlayers.forEach(eventRecorder::recordPlayerFinished);
        if (progressChanged) {
            eventRecorder.recordPlayerProgressUpdated(race);
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

    private PlayerChangeType resolvePlayerChange(
            PlayerLiveState before,
            RacePlayer racePlayer
    ) {
        Objects.requireNonNull(before);
        PlayerLiveState after = capturePlayer(racePlayer);
        if (before.status() != RacePlayerStatus.FINISHED
                && after.status() == RacePlayerStatus.FINISHED) {
            return PlayerChangeType.FINISHED;
        }
        return before.equals(after)
                ? PlayerChangeType.NONE
                : PlayerChangeType.PROGRESS;
    }

    private void recordPlayerChange(
            PlayerChangeType type,
            RacePlayer racePlayer
    ) {
        if (type == PlayerChangeType.FINISHED) {
            eventRecorder.recordPlayerFinished(racePlayer);
        } else if (type == PlayerChangeType.PROGRESS) {
            eventRecorder.recordPlayerProgressUpdated(
                    Objects.requireNonNull(racePlayer.getRace())
            );
        }
    }

    public record PlayerChange(PlayerLiveState before, RacePlayer racePlayer) {

        public PlayerChange {
            Objects.requireNonNull(before);
            Objects.requireNonNull(racePlayer);
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

    private enum PlayerChangeType {
        NONE,
        PROGRESS,
        FINISHED
    }
}
