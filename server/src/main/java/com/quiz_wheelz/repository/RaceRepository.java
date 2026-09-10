package com.quiz_wheelz.repository;

import com.quiz_wheelz.entitys.Race;
import com.quiz_wheelz.entitys.User;
import com.quiz_wheelz.enums.RacePlayerStatus;
import com.quiz_wheelz.enums.RaceStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface RaceRepository extends JpaRepository<Race, Long> {

    Optional<Race> findByRoomCode(String roomCode);

    @Query("select r.status from Race r where r.id = :raceId")
    RaceStatus findStatusById(@Param("raceId") Long raceId);

    @Modifying(flushAutomatically = true)
    @Query(value = """
            update races
            set authoritative_decision_time_floor_epoch_ms = :decisionEpochMs
            where id = :raceId
              and (authoritative_decision_time_floor_epoch_ms is null
                   or authoritative_decision_time_floor_epoch_ms < :decisionEpochMs)
            """, nativeQuery = true)
    int advanceDecisionTimeFloor(
            @Param("raceId") Long raceId,
            @Param("decisionEpochMs") long decisionEpochMs
    );

    @Query(value = """
            select authoritative_decision_time_floor_epoch_ms
            from races where id = :raceId for update
            """, nativeQuery = true)
    Long findLockedDecisionTimeFloor(@Param("raceId") Long raceId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select r from Race r where r.id = :raceId")
    Optional<Race> findLockedById(@Param("raceId") Long raceId);

    @Query("""
            select race.id
            from Race race
            where race.status = :raceStatus
              and not exists (
                  select racePlayer.id
                  from RacePlayer racePlayer
                  where racePlayer.race = race
                    and racePlayer.status in :activeStatuses
              )
            """)
    List<Long> findRaceIdsWithoutPlayersInStatuses(
            @Param("raceStatus") RaceStatus raceStatus,
            @Param("activeStatuses") Collection<RacePlayerStatus> activeStatuses
    );

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select r from Race r where r.roomCode = :roomCode")
    Optional<Race> findByRoomCodeForUpdate(@Param("roomCode") String roomCode);

    boolean existsByRoomCode(String roomCode);

    List<Race> findByTeacherOrderByCreatedAtDesc(User teacher);

    List<Race> findByTeacherAndStatusOrderByCreatedAtDesc(User teacher, RaceStatus status);

    Optional<Race> findByIdAndTeacher(Long raceId, User teacher);

    @Modifying(flushAutomatically = true)
    @Query(
            value = """
                    update races
                    set live_event_version = live_event_version + 1
                    where id = :raceId
                    """,
            nativeQuery = true
    )
    int incrementLiveEventVersion(@Param("raceId") Long raceId);

    @Query(
            value = "select live_event_version from races where id = :raceId",
            nativeQuery = true
    )
    Long findLiveEventVersion(@Param("raceId") Long raceId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select r from Race r where r.id = :raceId and r.teacher = :teacher")
    Optional<Race> findByIdAndTeacherForUpdate(
            @Param("raceId") Long raceId,
            @Param("teacher") User teacher
    );
}
