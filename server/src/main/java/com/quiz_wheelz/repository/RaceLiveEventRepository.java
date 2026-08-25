package com.quiz_wheelz.repository;

import com.quiz_wheelz.entitys.RaceLiveEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface RaceLiveEventRepository extends JpaRepository<RaceLiveEvent, Long> {

    @Query("""
            select event
            from RaceLiveEvent event
            where event.race.id = :raceId
              and event.version > :afterVersion
            order by event.version asc
            """)
    List<RaceLiveEvent> findAfterVersionOrdered(
            @Param("raceId") Long raceId,
            @Param("afterVersion") Long afterVersion
    );

    long countByRaceId(Long raceId);
}
