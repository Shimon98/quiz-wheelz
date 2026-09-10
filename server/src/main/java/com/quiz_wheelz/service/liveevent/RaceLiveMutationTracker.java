package com.quiz_wheelz.service.liveevent;

import com.quiz_wheelz.entitys.Race;
import com.quiz_wheelz.entitys.RacePlayer;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.Objects;

@Service
public class RaceLiveMutationTracker {

    private final RaceLiveMutationGate mutationGate;
    private final RaceLiveEventChangeRecorder changeRecorder;

    public RaceLiveMutationTracker(
            RaceLiveMutationGate mutationGate,
            RaceLiveEventChangeRecorder changeRecorder
    ) {
        this.mutationGate = Objects.requireNonNull(mutationGate);
        this.changeRecorder = Objects.requireNonNull(changeRecorder);
    }

    @Transactional(propagation = Propagation.MANDATORY)
    public RaceLiveMutationContext begin(RacePlayer lockedRacePlayer) {
        Objects.requireNonNull(lockedRacePlayer);
        Race activeRace = mutationGate.lockIfActive(lockedRacePlayer).orElse(null);
        if (activeRace == null) {
            return new RaceLiveMutationContext(null, null, null);
        }

        return new RaceLiveMutationContext(
                activeRace,
                changeRecorder.capturePlayer(lockedRacePlayer),
                changeRecorder.captureRace(activeRace)
        );
    }

    @Transactional(propagation = Propagation.MANDATORY)
    public void recordChanges(
            RaceLiveMutationContext context,
            RacePlayer lockedRacePlayer
    ) {
        Objects.requireNonNull(context);
        Objects.requireNonNull(lockedRacePlayer);
        if (!context.active()) {
            return;
        }

        changeRecorder.recordPlayerChange(context.playerBefore(), lockedRacePlayer);
        changeRecorder.recordRaceChange(context.raceBefore(), context.activeRace());
    }
}
