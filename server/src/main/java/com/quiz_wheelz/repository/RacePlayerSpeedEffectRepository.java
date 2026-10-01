package com.quiz_wheelz.repository;

import com.quiz_wheelz.entitys.RacePlayerSpeedEffect;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface RacePlayerSpeedEffectRepository extends JpaRepository<RacePlayerSpeedEffect, Long> {

    @Query("""
            select effect from RacePlayerSpeedEffect effect
            where effect.racePlayer.id = :playerId
              and effect.startsAtEpochMs < :toEpochMs
              and effect.endsAtEpochMs > :fromEpochMs
            order by effect.startsAtEpochMs asc, effect.id asc
            """)
    List<RacePlayerSpeedEffect> findOverlapping(
            @Param("playerId") Long playerId,
            @Param("fromEpochMs") long fromEpochMs,
            @Param("toEpochMs") long toEpochMs
    );
}
