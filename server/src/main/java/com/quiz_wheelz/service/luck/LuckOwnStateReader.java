package com.quiz_wheelz.service.luck;

import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
@Transactional(propagation = Propagation.MANDATORY)
public class LuckOwnStateReader {
    private final EntityManager em;

    public boolean hasChallenge(long playerId) {
        em.flush();
        return !em.createNativeQuery("""
                select id from race_player_challenge_offers where race_player_id = :id
                and (status = 'ACTIVE' or (status = 'SELECTED' and execution_ended_at_epoch_ms is null)) for update
                """).setParameter("id", playerId).getResultList().isEmpty();
    }

    public boolean hasSpeedEffect(long playerId, long instant) {
        em.flush();
        return !em.createNativeQuery("""
                select id from race_player_speed_effects where race_player_id = :id
                and type in ('SPEED_SLOW','SPEED_BOOST') and starts_at_epoch_ms <= :instant
                and ends_at_epoch_ms > :instant for update
                """).setParameter("id", playerId).setParameter("instant", instant).getResultList().isEmpty();
    }
    public boolean hasOverlap(long playerId, long start, long end) {
        em.flush();
        return !em.createNativeQuery("""
                select id from race_player_speed_effects where race_player_id = :id
                and starts_at_epoch_ms < :end and ends_at_epoch_ms > :start for update
                """).setParameter("id", playerId).setParameter("start", start).setParameter("end", end)
                .getResultList().isEmpty();
    }
}