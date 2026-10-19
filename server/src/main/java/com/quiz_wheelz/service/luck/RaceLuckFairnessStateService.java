package com.quiz_wheelz.service.luck;

import com.quiz_wheelz.entitys.RaceLuckFairnessState;
import com.quiz_wheelz.entitys.RacePlayer;
import com.quiz_wheelz.repository.RaceLuckFairnessStateRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.LockModeType;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(propagation = Propagation.MANDATORY)
public class RaceLuckFairnessStateService {
    private final RaceLuckFairnessStateRepository states;
    private final LuckTransactionGuard guard;
    private final EntityManager em;

    public RaceLuckFairnessState obtainForLockedPlayer(RacePlayer player) {
        guard.requireLocked(player);
        states.initializeIfAbsent(player.getRace().getId());
        var state = states.findLockedByRaceId(player.getRace().getId()).orElseThrow();
        em.refresh(state, LockModeType.PESSIMISTIC_WRITE);
        return state;
    }
}
