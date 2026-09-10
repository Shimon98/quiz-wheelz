package com.quiz_wheelz.dto.liveevent;

import com.quiz_wheelz.enums.RaceLiveEventType;

public record RaceLiveEventSignal(long version, RaceLiveEventType type, long occurredAtEpochMs) {
}
