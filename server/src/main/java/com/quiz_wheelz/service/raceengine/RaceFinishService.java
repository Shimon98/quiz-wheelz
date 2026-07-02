package com.quiz_wheelz.service.raceengine;

import com.quiz_wheelz.common.RaceProgressRules;
import com.quiz_wheelz.entitys.Race;
import com.quiz_wheelz.entitys.RacePlayer;
import com.quiz_wheelz.enums.RacePlayerStatus;
import com.quiz_wheelz.enums.RaceStatus;
import com.quiz_wheelz.exception.ApiException;
import com.quiz_wheelz.exception.ErrorCode;
import com.quiz_wheelz.repository.RacePlayerRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class RaceFinishService {

    private final RacePlayerRepository racePlayerRepository;

    public RaceFinishService(RacePlayerRepository racePlayerRepository) {
        this.racePlayerRepository = racePlayerRepository;
    }

    public boolean finishPlayerIfNeeded(RacePlayer racePlayer) {
        if (racePlayer == null
                || racePlayer.getRace() == null
                || racePlayer.getStatus() == RacePlayerStatus.FINISHED
                || racePlayer.getStatus() == RacePlayerStatus.DISCONNECTED) {
            return false;
        }

        Integer totalDistance = racePlayer.getRace().getTotalDistance();

        if (totalDistance == null) {
            throw new ApiException(ErrorCode.RACE_TOTAL_DISTANCE_MISSING);
        }

        double position = racePlayer.getPosition() == null ? 0.0 : racePlayer.getPosition();

        if (position < totalDistance) {
            return false;
        }

        racePlayer.setPosition(totalDistance.doubleValue());
        racePlayer.setStatus(RacePlayerStatus.FINISHED);
        racePlayer.setSpeed(RaceProgressRules.FINISHED_SPEED);
        racePlayer.setFinishedAt(LocalDateTime.now());

        return true;
    }

    public boolean finishRaceIfNeeded(Race race) {
        if (race == null || race.getStatus() == RaceStatus.FINISHED) {
            return false;
        }

        List<RacePlayer> players = racePlayerRepository.findByRaceOrderByLaneNumberAsc(race);

        if (players.isEmpty() || players.stream().anyMatch(this::isStillActive)) {
            return false;
        }

        race.setStatus(RaceStatus.FINISHED);
        race.setFinishedAt(LocalDateTime.now());

        return true;
    }

    private boolean isStillActive(RacePlayer player) {
        return player.getStatus() == RacePlayerStatus.WAITING
                || player.getStatus() == RacePlayerStatus.RACING;
    }
}
