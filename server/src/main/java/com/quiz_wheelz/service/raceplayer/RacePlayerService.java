package com.quiz_wheelz.service.raceplayer;

import com.quiz_wheelz.common.RaceProgressRules;
import com.quiz_wheelz.entitys.Race;
import com.quiz_wheelz.entitys.RacePlayer;
import com.quiz_wheelz.enums.RacePlayerStatus;
import com.quiz_wheelz.repository.RacePlayerRepository;
import com.quiz_wheelz.utils.DateTimeUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class RacePlayerService {

    private final RacePlayerRepository racePlayerRepository;
    private final Clock clock;

    public RacePlayerService(RacePlayerRepository racePlayerRepository, Clock clock) {
        this.racePlayerRepository = racePlayerRepository;
        this.clock = clock;
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

        long startedAtEpochMs = DateTimeUtils.toEpochMilli(startedAt, clock.getZone());
        int startedPlayers = 0;

        for (RacePlayer player : players) {
            if (player.getStatus() == RacePlayerStatus.WAITING) {
                player.setStatus(RacePlayerStatus.RACING);
                player.setSpeed(RaceProgressRules.MIN_RACING_SPEED);
                player.setStartedAt(startedAt);
                player.setMovementUpdatedAtEpochMs(startedAtEpochMs);
                startedPlayers++;
            }
        }

        return startedPlayers;
    }
}