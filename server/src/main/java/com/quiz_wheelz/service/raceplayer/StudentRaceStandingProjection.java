package com.quiz_wheelz.service.raceplayer;

public record StudentRaceStandingProjection(
        double position,
        long effectiveAtEpochMs,
        Long finishCrossingEpochMs,
        double effectiveSpeed
) {
    public boolean crossedFinish() {
        return finishCrossingEpochMs != null;
    }
}
