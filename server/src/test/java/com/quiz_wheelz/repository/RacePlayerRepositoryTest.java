package com.quiz_wheelz.repository;

import com.quiz_wheelz.entitys.Race;
import com.quiz_wheelz.entitys.RacePlayer;
import com.quiz_wheelz.entitys.Subject;
import com.quiz_wheelz.entitys.User;
import com.quiz_wheelz.enums.RacePlayerStatus;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.test.context.ActiveProfiles;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

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

    @Test
    void groupedPlayerCountsReturnOnlyRequestedRacesWithPlayers() {
        Race firstRace = persistRace("CNT001");
        Race secondRace = persistRace("CNT002");
        Race emptyRace = persistRace("CNT003");
        Race outsideRace = persistRace("CNT004");
        RacePlayer waiting = persistRacePlayer(firstRace, "Noa", 1);
        RacePlayer finished = persistRacePlayer(firstRace, "Ari", 2);
        RacePlayer racing = persistRacePlayer(secondRace, "Maya", 1);
        RacePlayer disconnected = persistRacePlayer(secondRace, "Dana", 2);
        persistRacePlayer(outsideRace, "Lior", 1);
        waiting.setStatus(RacePlayerStatus.WAITING);
        finished.setStatus(RacePlayerStatus.FINISHED);
        racing.setStatus(RacePlayerStatus.RACING);
        disconnected.setStatus(RacePlayerStatus.DISCONNECTED);

        List<RacePlayerRepository.RacePlayerCountByRace> counts =
                racePlayerRepository.countPlayersByRaceIds(
                        List.of(firstRace.getId(), secondRace.getId(), emptyRace.getId())
                );
        Map<Long, Long> countsByRaceId = counts.stream()
                .collect(Collectors.toMap(
                        RacePlayerRepository.RacePlayerCountByRace::getRaceId,
                        RacePlayerRepository.RacePlayerCountByRace::getPlayerCount
                ));

        assertEquals(
                Map.of(firstRace.getId(), 2L, secondRace.getId(), 2L),
                countsByRaceId
        );
    }

    private RacePlayer persistRacePlayer(String roomCode, String displayName) {
        return persistRacePlayer(persistRace(roomCode), displayName, 1);
    }

    private Race persistRace(String roomCode) {
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

        return race;
    }

    private RacePlayer persistRacePlayer(Race race, String displayName, int laneNumber) {
        RacePlayer racePlayer = new RacePlayer();
        racePlayer.setRace(race);
        racePlayer.setDisplayName(displayName);
        racePlayer.setLaneNumber(laneNumber);
        entityManager.persistAndFlush(racePlayer);
        return racePlayer;
    }
}
