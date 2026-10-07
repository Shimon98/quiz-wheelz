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
                        new RaceSpeedEffectMovementCalculator(new RaceMovementCalculator()), new com.quiz_wheelz.service.challenge.StudentChallengeProjectionService(org.mockito.Mockito.mock(com.quiz_wheelz.repository.RacePlayerGameplayStateRepository.class), org.mockito.Mockito.mock(com.quiz_wheelz.service.challenge.ChallengeOfferService.class))));
    }
}
