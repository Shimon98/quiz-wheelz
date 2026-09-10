package com.quiz_wheelz.service.liveevent;

import com.quiz_wheelz.entitys.Race;
import com.quiz_wheelz.service.liveevent.RaceLiveEventChangeRecorder.PlayerLiveState;
import com.quiz_wheelz.service.liveevent.RaceLiveEventChangeRecorder.RaceLiveState;

public record RaceLiveMutationContext(
        Race activeRace,
        PlayerLiveState playerBefore,
        RaceLiveState raceBefore
) {

    public RaceLiveMutationContext {
        boolean active = activeRace != null;
        if (active != (playerBefore != null) || active != (raceBefore != null)) {
            throw new IllegalArgumentException();
        }
    }

    public boolean active() {
        return activeRace != null;
    }
}
