package com.quiz_wheelz.service.luck;

import com.quiz_wheelz.entitys.*;
import com.quiz_wheelz.repository.RacePlayerGameplayStateRepository;
import com.quiz_wheelz.service.raceplayer.RacePlayerGameplayStateService;
import jakarta.persistence.EntityManager;
import jakarta.persistence.LockModeType;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(propagation = Propagation.MANDATORY)
public class GuardShieldService {
    private final RacePlayerGameplayStateRepository states;
    private final RacePlayerGameplayStateService initialStates;
    private final LuckTransactionGuard guard;
    private final EntityManager em;
    private final GuardShieldPolicy policy = new GuardShieldPolicy();

    public RacePlayerGameplayState obtainForLockedPlayer(RacePlayer player) {
        guard.requireLocked(player);
        return states.findLockedByRacePlayerId(player.getId()).map(state -> {
            em.refresh(state, LockModeType.PESSIMISTIC_WRITE);
            return state;
        }).orElseGet(() -> initialStates.createInitialState(player));
    }

    public boolean afterAcceptedManualNormalAnswer(RacePlayerGameplayState state, PlayerQuestion question,
                                                   boolean correct, boolean firstAccepted) {
        guard.requireLocked(state.getRacePlayer());
        guard.requireOwnedAnsweredNormal(state.getRacePlayer(), question);
        return policy.award(state, question, firstAccepted, correct);
    }
}