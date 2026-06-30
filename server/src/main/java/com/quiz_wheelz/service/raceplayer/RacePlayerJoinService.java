package com.quiz_wheelz.service.raceplayer;

import com.quiz_wheelz.common.RacePlayerRules;
import com.quiz_wheelz.dto.raceplayer.RacePlayerJoinRequest;
import com.quiz_wheelz.dto.raceplayer.RacePlayerJoinResponse;
import com.quiz_wheelz.dto.raceplayer.RacePlayerJoinResult;
import com.quiz_wheelz.entitys.Race;
import com.quiz_wheelz.entitys.RacePlayer;
import com.quiz_wheelz.enums.Difficulty;
import com.quiz_wheelz.enums.RacePlayerStatus;
import com.quiz_wheelz.enums.RaceStatus;
import com.quiz_wheelz.exception.ApiException;
import com.quiz_wheelz.exception.ErrorCode;
import com.quiz_wheelz.repository.RacePlayerRepository;
import com.quiz_wheelz.repository.RaceRepository;
import com.quiz_wheelz.service.auth.JwtService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;
import java.util.stream.Collectors;

@Service
public class RacePlayerJoinService {

    private final RaceRepository raceRepository;
    private final RacePlayerRepository racePlayerRepository;
    private final JwtService jwtService;

    public RacePlayerJoinService(
            RaceRepository raceRepository,
            RacePlayerRepository racePlayerRepository,
            JwtService jwtService
    ) {
        this.raceRepository = raceRepository;
        this.racePlayerRepository = racePlayerRepository;
        this.jwtService = jwtService;
    }

    @Transactional
    public RacePlayerJoinResult joinRace(RacePlayerJoinRequest request) {
        String roomCode = normalizeRoomCode(request.getRoomCode());
        String displayName = normalizeDisplayName(request.getDisplayName());

        Race race = raceRepository.findByRoomCodeForUpdate(roomCode)
                .orElseThrow(() -> new ApiException(ErrorCode.RACE_NOT_FOUND));

        validateRaceCanBeJoined(race);
        validateDisplayNameIsAvailable(race, displayName);

        int laneNumber = resolveNextAvailableLane(race);

        RacePlayer racePlayer = new RacePlayer();
        racePlayer.setRace(race);
        racePlayer.setDisplayName(displayName);
        racePlayer.setLaneNumber(laneNumber);
        racePlayer.setVehicleTypeKey(RacePlayerRules.DEFAULT_VEHICLE_TYPE_KEY);
        racePlayer.setVehicleColorKey(resolveVehicleColorKey(laneNumber));
        racePlayer.setStatus(RacePlayerStatus.WAITING);
        racePlayer.setCurrentDifficulty(Difficulty.EASY);

        RacePlayer savedPlayer = racePlayerRepository.save(racePlayer);

        long currentPlayers = racePlayerRepository.countByRace(race);

        RacePlayerJoinResponse response = RacePlayerJoinResponse.from(
                race,
                savedPlayer,
                currentPlayers
        );

        String racePlayerToken = jwtService.createRacePlayerToken(
                race.getId(),
                savedPlayer.getId(),
                savedPlayer.getDisplayName()
        );

        return new RacePlayerJoinResult(response, racePlayerToken);
    }

    private void validateRaceCanBeJoined(Race race) {
        if (race.getStatus() != RaceStatus.WAITING_FOR_PLAYERS) {
            throw new ApiException(ErrorCode.RACE_NOT_JOINABLE);
        }
        long currentPlayers = racePlayerRepository.countByRace(race);

        if (currentPlayers >= race.getMaxPlayers()) {
            throw new ApiException(ErrorCode.RACE_FULL);
        }
    }

    private void validateDisplayNameIsAvailable(Race race, String displayName) {
        if (racePlayerRepository.existsByRaceAndDisplayNameIgnoreCase(race, displayName)) {
            throw new ApiException(ErrorCode.RACE_PLAYER_NAME_TAKEN);
        }
    }

    private int resolveNextAvailableLane(Race race) {
        Set<Integer> usedLanes = racePlayerRepository.findByRaceOrderByLaneNumberAsc(race)
                .stream()
                .map(RacePlayer::getLaneNumber)
                .collect(Collectors.toSet());

        for (int lane = RacePlayerRules.MIN_LANE_NUMBER; lane <= race.getMaxPlayers(); lane++) {
            if (!usedLanes.contains(lane)) {
                return lane;
            }
        }

        throw new ApiException(ErrorCode.RACE_FULL);
    }

    private String resolveVehicleColorKey(int laneNumber) {
        int index = Math.floorMod(laneNumber - 1, RacePlayerRules.VEHICLE_COLOR_KEYS.size());
        return RacePlayerRules.VEHICLE_COLOR_KEYS.get(index);
    }

    private String normalizeRoomCode(String roomCode) {
        return roomCode.trim().toUpperCase();
    }

    private String normalizeDisplayName(String displayName) {
        return displayName.trim().replaceAll("\\s+", " ");
    }
}
