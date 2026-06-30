package com.quiz_wheelz.service.raceplayer;

import com.quiz_wheelz.entitys.Race;
import com.quiz_wheelz.entitys.RacePlayer;
import com.quiz_wheelz.enums.RacePlayerStatus;
import com.quiz_wheelz.repository.RacePlayerRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class RacePlayerService {

    private final RacePlayerRepository racePlayerRepository;

    public RacePlayerService(RacePlayerRepository racePlayerRepository) {
        this.racePlayerRepository = racePlayerRepository;
    }

    @Transactional(readOnly = true)
    public List<RacePlayer> findPlayersByRaceOrderedByLane(Race race) {
        return racePlayerRepository.findByRaceOrderByLaneNumberAsc(race);
    }

    @Transactional(readOnly = true)
    public long countPlayersByRace(Race race) {
        return racePlayerRepository.countByRace(race);
    }

    @Transactional(readOnly = true)
    public long countPlayersByRaceAndStatus(Race race, RacePlayerStatus status) {
        return racePlayerRepository.countByRaceAndStatus(race, status);
    }

    @Transactional
    public int startWaitingPlayers(Race race, LocalDateTime startedAt) {
        List<RacePlayer> players = racePlayerRepository.findByRaceOrderByLaneNumberAsc(race);

        int startedPlayers = 0;

        for (RacePlayer player : players) {
            if (player.getStatus() == RacePlayerStatus.WAITING) {
                player.setStatus(RacePlayerStatus.RACING);
                player.setStartedAt(startedAt);
                startedPlayers++;
            }
        }

        return startedPlayers;
    }
}