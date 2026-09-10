package com.quiz_wheelz.service.raceengine;

import com.quiz_wheelz.entitys.Race;
import com.quiz_wheelz.repository.RaceRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.Objects;

@Service
public class RaceDecisionTimeService {

    private final RaceRepository raceRepository;

    public RaceDecisionTimeService(RaceRepository raceRepository) {
        this.raceRepository = Objects.requireNonNull(raceRepository);
    }

    @Transactional(propagation = Propagation.MANDATORY)
    public long advance(Race lockedRace, long requestedEpochMs) {
        Objects.requireNonNull(lockedRace);
        Long raceId = Objects.requireNonNull(lockedRace.getId());
        raceRepository.advanceDecisionTimeFloor(raceId, requestedEpochMs);
        long decisionEpochMs = Objects.requireNonNull(
                raceRepository.findLockedDecisionTimeFloor(raceId)
        );
        lockedRace.setAuthoritativeDecisionTimeFloorEpochMs(decisionEpochMs);
        return decisionEpochMs;
    }
}
