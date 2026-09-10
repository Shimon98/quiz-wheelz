package com.quiz_wheelz.dto.liveevent;

public sealed interface RaceLiveEventPayload permits
        PlayerJoinedLiveEventPayload,
        RaceStartedLiveEventPayload,
        QuestionAnsweredLiveEventPayload,
        PlayerProgressUpdatedLiveEventPayload,
        PlayerFinishedLiveEventPayload,
        RaceFinishedLiveEventPayload {
}
