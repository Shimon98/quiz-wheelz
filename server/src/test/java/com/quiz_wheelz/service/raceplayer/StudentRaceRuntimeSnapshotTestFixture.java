package com.quiz_wheelz.service.raceplayer;

import com.quiz_wheelz.service.raceengine.RaceMovementCalculator;
import com.quiz_wheelz.service.raceengine.RacePlayerSpeedEffectService;
import com.quiz_wheelz.service.raceengine.RaceSpeedEffectMovementCalculator;

import static org.mockito.Mockito.mock;

public final class StudentRaceRuntimeSnapshotTestFixture {

    private StudentRaceRuntimeSnapshotTestFixture() {
    }

    public static StudentRaceRuntimeSnapshotService service() {
        return new StudentRaceRuntimeSnapshotService(new StudentRaceRuntimeSnapshotMapper(),
                new StudentRaceGameplayProjectionService(mock(RacePlayerSpeedEffectService.class),
                        new RaceSpeedEffectMovementCalculator(new RaceMovementCalculator())));
    }
}
