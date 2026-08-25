package com.quiz_wheelz.dto.teacher;

import com.quiz_wheelz.enums.RaceFocusPolicy;
import lombok.Getter;

import java.util.List;
import java.util.Objects;

@Getter
public class TeacherRaceLiveStateResponse {

    private final Long raceId;
    private final String title;
    private final String roomCode;
    private final String status;
    private final Integer totalDistance;
    private final RaceFocusPolicy focusPolicy;
    private final Long serverTimeEpochMs;
    private final Double baseMovementUnitsPerSecond;
    private final Long eventVersion;
    private final List<TeacherRaceLivePlayerResponse> players;

    public TeacherRaceLiveStateResponse(
            Long raceId,
            String title,
            String roomCode,
            String status,
            Integer totalDistance,
            RaceFocusPolicy focusPolicy,
            Long serverTimeEpochMs,
            Double baseMovementUnitsPerSecond,
            Long eventVersion,
            List<TeacherRaceLivePlayerResponse> players
    ) {
        this.raceId = raceId;
        this.title = title;
        this.roomCode = roomCode;
        this.status = status;
        this.totalDistance = totalDistance;
        this.focusPolicy = focusPolicy;
        this.serverTimeEpochMs = serverTimeEpochMs;
        this.baseMovementUnitsPerSecond = baseMovementUnitsPerSecond;
        this.eventVersion = eventVersion;
        this.players = List.copyOf(Objects.requireNonNull(players));
    }
}
