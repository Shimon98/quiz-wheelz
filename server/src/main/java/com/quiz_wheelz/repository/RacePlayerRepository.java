package com.quiz_wheelz.repository;

import com.quiz_wheelz.entitys.Race;
import com.quiz_wheelz.entitys.RacePlayer;
import com.quiz_wheelz.enums.RacePlayerStatus;
import com.quiz_wheelz.enums.RaceStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface RacePlayerRepository extends JpaRepository<RacePlayer, Long> {

    interface RacePlayerMovementCandidate {
        Long getPlayerId();

        Long getRaceId();
    }

    @Query("""
            select racePlayer.id as playerId, racePlayer.race.id as raceId
            from RacePlayer racePlayer
            where racePlayer.status = :playerStatus
              and racePlayer.race.status = :raceStatus
            """)
    List<RacePlayerMovementCandidate> findMovementSettlementCandidates(
            @Param("playerStatus") RacePlayerStatus playerStatus,
            @Param("raceStatus") RaceStatus raceStatus
    );

    List<RacePlayer> findByRaceOrderByLaneNumberAsc(Race race);

    List<RacePlayer> findByRaceOrderByPositionDesc(Race race);

    List<RacePlayer> findByRaceAndStatusOrderByLaneNumberAsc(
            Race race,
            RacePlayerStatus status
    );

    Optional<RacePlayer> findByIdAndRace(Long playerId, Race race);

    Optional<RacePlayer> findByIdAndRaceId(Long playerId, Long raceId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<RacePlayer> findLockedByIdAndRaceId(
            Long playerId,
            Long raceId
    );

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            select racePlayer
            from RacePlayer racePlayer
            where racePlayer.race.id = :raceId
            order by racePlayer.id asc
            """)
    List<RacePlayer> findAllLockedByRaceIdOrderById(
            @Param("raceId") Long raceId
    );

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
            update RacePlayer racePlayer
            set racePlayer.lastSeenAt = :checkpointAt
            where racePlayer.id = :racePlayerId
              and racePlayer.race.id = :raceId
              and (racePlayer.lastSeenAt is null or racePlayer.lastSeenAt < :checkpointAt)
            """)
    int updateLastSeenAtIfOlder(
            @Param("racePlayerId") Long racePlayerId,
            @Param("raceId") Long raceId,
            @Param("checkpointAt") LocalDateTime checkpointAt
    );

    long countByRace(Race race);

    boolean existsByRaceAndLaneNumber(Race race, Integer laneNumber);

    boolean existsByRaceAndDisplayNameIgnoreCase(Race race, String displayName);

    long countByRaceAndStatus(Race race, RacePlayerStatus status);
}
