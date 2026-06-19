package com.quiz_wheelz.repository;

import com.quiz_wheelz.entitys.Race;
import com.quiz_wheelz.entitys.User;
import com.quiz_wheelz.enums.RaceStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RaceRepository extends JpaRepository<Race, Long> {

    Optional<Race> findByRoomCode(String roomCode);

    boolean existsByRoomCode(String roomCode);

    List<Race> findByTeacherOrderByCreatedAtDesc(User teacher);

    List<Race> findByTeacherAndStatusOrderByCreatedAtDesc(User teacher, RaceStatus status);

    Optional<Race> findByIdAndTeacher(Long raceId, User teacher);
}