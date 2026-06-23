package com.quiz_wheelz.repository;

import com.quiz_wheelz.entitys.Race;
import com.quiz_wheelz.entitys.User;
import com.quiz_wheelz.enums.RaceStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface RaceRepository extends JpaRepository<Race, Long> {

    Optional<Race> findByRoomCode(String roomCode);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select r from Race r where r.roomCode = :roomCode")
    Optional<Race> findByRoomCodeForUpdate(@Param("roomCode") String roomCode);

    boolean existsByRoomCode(String roomCode);

    List<Race> findByTeacherOrderByCreatedAtDesc(User teacher);

    List<Race> findByTeacherAndStatusOrderByCreatedAtDesc(User teacher, RaceStatus status);

    Optional<Race> findByIdAndTeacher(Long raceId, User teacher);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select r from Race r where r.id = :raceId and r.teacher = :teacher")
    Optional<Race> findByIdAndTeacherForUpdate(
            @Param("raceId") Long raceId,
            @Param("teacher") User teacher
    );
}