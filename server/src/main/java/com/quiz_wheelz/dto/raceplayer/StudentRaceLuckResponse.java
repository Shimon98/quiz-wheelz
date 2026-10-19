package com.quiz_wheelz.dto.raceplayer;

import com.quiz_wheelz.enums.LuckEventType;
import com.quiz_wheelz.enums.LuckOutcome;
import java.util.List;
import java.util.Objects;

public record StudentRaceLuckResponse(List<Event> recentEvents) {
    public StudentRaceLuckResponse {
        recentEvents = List.copyOf(Objects.requireNonNull(recentEvents));
    }

    public record Event(Long eventId, LuckEventType selectedType, LuckEventType appliedType,
                        LuckOutcome outcome, long occurredAtEpochMs) {
    }
}
