package com.quiz_wheelz.service.liveevent;

import com.quiz_wheelz.entitys.Race;
import com.quiz_wheelz.entitys.RacePlayer;
import com.quiz_wheelz.enums.RacePlayerStatus;
import com.quiz_wheelz.enums.RaceStatus;
import com.quiz_wheelz.repository.RaceRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.Objects;
import java.util.Optional;

@Service
public class RaceLiveMutationGate {

    private final RaceRepository raceRepository;

    public RaceLiveMutationGate(RaceRepository raceRepository) {
        this.raceRepository = Objects.requireNonNull(raceRepository);
    }

    @Transactional(propagation = Propagation.MANDATORY)
    public Optional<Race> lockIfActive(RacePlayer lockedRacePlayer) {
        Objects.requireNonNull(lockedRacePlayer);

        if (lockedRacePlayer.getStatus() != RacePlayerStatus.RACING) {
            return Optional.empty();
        }

        Race race = Objects.requireNonNull(lockedRacePlayer.getRace());
        Race lockedRace = raceRepository.findLockedById(
                        Objects.requireNonNull(race.getId())
                )
                .orElseThrow(IllegalStateException::new);

        return lockedRace.getStatus() == RaceStatus.IN_PROGRESS
                ? Optional.of(lockedRace)
                : Optional.empty();
    }
}
