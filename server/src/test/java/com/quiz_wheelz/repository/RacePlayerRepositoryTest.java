package com.quiz_wheelz.repository;

import com.quiz_wheelz.entitys.Race;
import com.quiz_wheelz.entitys.RacePlayer;
import com.quiz_wheelz.entitys.Subject;
import com.quiz_wheelz.entitys.User;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.test.context.ActiveProfiles;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;

@DataJpaTest
@ActiveProfiles("test")
class RacePlayerRepositoryTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private RacePlayerRepository racePlayerRepository;

    @Test
    void focusedCheckpointShouldUpdateOnlyMatchingRacePlayer() {
        RacePlayer racePlayer = persistRacePlayer("ABC123", "Noa");
        LocalDateTime checkpointAt = LocalDateTime.of(2027, 8, 17, 12, 0);

        int updated = racePlayerRepository.updateLastSeenAtIfOlder(
                racePlayer.getId(),
                racePlayer.getRace().getId(),
                checkpointAt
        );

        assertEquals(1, updated);
        assertEquals(checkpointAt, entityManager.find(RacePlayer.class, racePlayer.getId()).getLastSeenAt());
    }

    @Test
    void focusedCheckpointShouldNotMoveLastSeenBackwards() {
        RacePlayer racePlayer = persistRacePlayer("DEF456", "Ari");
        LocalDateTime newer = LocalDateTime.of(2027, 8, 17, 12, 1);
        LocalDateTime older = newer.minusSeconds(1);
        racePlayerRepository.updateLastSeenAtIfOlder(
                racePlayer.getId(),
                racePlayer.getRace().getId(),
                newer
        );

        int updated = racePlayerRepository.updateLastSeenAtIfOlder(
                racePlayer.getId(),
                racePlayer.getRace().getId(),
                older
        );

        assertEquals(0, updated);
        assertEquals(newer, entityManager.find(RacePlayer.class, racePlayer.getId()).getLastSeenAt());
    }

    @Test
    void focusedCheckpointShouldRejectMismatchedRaceScope() {
        RacePlayer racePlayer = persistRacePlayer("GHI789", "Maya");

        int updated = racePlayerRepository.updateLastSeenAtIfOlder(
                racePlayer.getId(),
                racePlayer.getRace().getId() + 999,
                LocalDateTime.of(2026, 8, 17, 12, 0)
        );

        assertEquals(0, updated);
    }

    private RacePlayer persistRacePlayer(String roomCode, String displayName) {
        User teacher = new User();
        teacher.setUsername("teacher-" + roomCode);
        teacher.setDisplayName("Teacher");
        entityManager.persist(teacher);

        Subject subject = new Subject();
        subject.setName("Math " + roomCode);
        subject.setCode("M" + roomCode);
        entityManager.persist(subject);

        Race race = new Race();
        race.setRoomCode(roomCode);
        race.setTitle("Test race");
        race.setMaxPlayers(2);
        race.setTotalDistance(100);
        race.setTeacher(teacher);
        race.setSubject(subject);
        entityManager.persist(race);

        RacePlayer racePlayer = new RacePlayer();
        racePlayer.setRace(race);
        racePlayer.setDisplayName(displayName);
        racePlayer.setLaneNumber(1);
        entityManager.persistAndFlush(racePlayer);
        return racePlayer;
    }
}
