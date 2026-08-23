package com.quiz_wheelz.service.raceplayer;

import com.quiz_wheelz.dto.raceplayer.RacePlayerSessionIdentity;
import com.quiz_wheelz.entitys.RacePlayer;
import com.quiz_wheelz.exception.ApiException;
import com.quiz_wheelz.exception.ErrorCode;
import com.quiz_wheelz.exception.ErrorMessages;
import com.quiz_wheelz.repository.RacePlayerRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Service;

import java.util.Objects;

@Service
public class RacePlayerSessionLockService {

    private final CurrentRacePlayerService currentRacePlayerService;
    private final RacePlayerRepository racePlayerRepository;

    public RacePlayerSessionLockService(
            CurrentRacePlayerService currentRacePlayerService,
            RacePlayerRepository racePlayerRepository
    ) {
        this.currentRacePlayerService = Objects.requireNonNull(currentRacePlayerService);
        this.racePlayerRepository = Objects.requireNonNull(racePlayerRepository);
    }

    public RacePlayerSessionIdentity resolveIdentity(HttpServletRequest request) {
        RacePlayerSessionIdentity identity =
                currentRacePlayerService.resolveCurrentRacePlayerIdentity(request);

        if (identity == null
                || identity.raceId() == null
                || identity.racePlayerId() == null) {
            throw new IllegalArgumentException(ErrorMessages.RACE_PLAYER_SESSION_IDENTITY_MISSING);
        }

        return identity;
    }

    public RacePlayer resolveAndLock(HttpServletRequest request) {
        return lock(currentRacePlayerService.resolveCurrentRacePlayerSession(request));
    }

    public RacePlayer lock(RacePlayerSessionIdentity identity) {
        if (identity == null) {
            throw new ApiException(ErrorCode.RACE_PLAYER_NOT_FOUND);
        }

        return lock(identity.racePlayerId(), identity.raceId());
    }

    public RacePlayer lock(RacePlayer racePlayer) {
        if (racePlayer == null
                || racePlayer.getId() == null
                || racePlayer.getRace() == null
                || racePlayer.getRace().getId() == null) {
            throw new ApiException(ErrorCode.RACE_PLAYER_NOT_FOUND);
        }

        return lock(racePlayer.getId(), racePlayer.getRace().getId());
    }

    private RacePlayer lock(Long racePlayerId, Long raceId) {
        if (racePlayerId == null || raceId == null) {
            throw new ApiException(ErrorCode.RACE_PLAYER_NOT_FOUND);
        }

        return racePlayerRepository
                .findLockedByIdAndRaceId(racePlayerId, raceId)
                .orElseThrow(() -> new ApiException(ErrorCode.RACE_PLAYER_NOT_FOUND));
    }
}
