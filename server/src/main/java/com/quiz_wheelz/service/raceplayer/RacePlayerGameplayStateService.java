package com.quiz_wheelz.service.raceplayer;

import com.quiz_wheelz.entitys.RacePlayer;
import com.quiz_wheelz.entitys.RacePlayerGameplayState;
import com.quiz_wheelz.repository.RacePlayerGameplayStateRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class RacePlayerGameplayStateService {

    private final RacePlayerGameplayStateRepository repository;

    @Transactional(propagation = Propagation.MANDATORY)
    public RacePlayerGameplayState obtainForLockedPlayer(RacePlayer racePlayer) {
        return repository.findByRacePlayerId(racePlayer.getId())
                .orElseGet(() -> createInitialState(racePlayer));
    }

    @Transactional(propagation = Propagation.MANDATORY)
    public RacePlayerGameplayState createInitialState(RacePlayer racePlayer) {
        RacePlayerGameplayState state = new RacePlayerGameplayState();
        state.setRacePlayer(racePlayer);
        return repository.save(state);
    }
}
