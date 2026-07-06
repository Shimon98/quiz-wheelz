package com.quiz_wheelz.service.raceplayer;

import com.quiz_wheelz.entitys.Race;
import com.quiz_wheelz.entitys.RacePlayer;
import com.quiz_wheelz.dto.raceplayer.RacePlayerSessionIdentity;
import com.quiz_wheelz.enums.RacePlayerStatus;
import com.quiz_wheelz.enums.RaceStatus;
import com.quiz_wheelz.exception.ApiException;
import com.quiz_wheelz.exception.ErrorCode;
import com.quiz_wheelz.repository.RacePlayerRepository;
import com.quiz_wheelz.security.JwtTokenTypes;
import com.quiz_wheelz.service.auth.JwtService;
import com.quiz_wheelz.utils.CookieUtils;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CurrentRacePlayerService {

    private final CookieUtils cookieUtils;
    private final JwtService jwtService;
    private final RacePlayerRepository racePlayerRepository;

    public CurrentRacePlayerService(
            CookieUtils cookieUtils,
            JwtService jwtService,
            RacePlayerRepository racePlayerRepository
    ) {
        this.cookieUtils = cookieUtils;
        this.jwtService = jwtService;
        this.racePlayerRepository = racePlayerRepository;
    }

    @Transactional(readOnly = true)
    public RacePlayer resolveCurrentRacePlayer(HttpServletRequest request) {
        RacePlayer racePlayer = resolveCurrentRacePlayerSession(request);
        validateRacePlayerCanReceiveQuestion(racePlayer);

        return racePlayer;
    }

    @Transactional(readOnly = true)
    public RacePlayer resolveCurrentRacePlayerSession(HttpServletRequest request) {
        RacePlayerSessionIdentity identity = resolveCurrentRacePlayerIdentity(request);

        return findRacePlayerFromIdentity(identity);
    }

    @Transactional(readOnly = true)
    public RacePlayerSessionIdentity resolveCurrentRacePlayerIdentity(
            HttpServletRequest request
    ) {
        String token = extractRacePlayerToken(request);
        validateRacePlayerToken(token);

        return extractRacePlayerIdentity(token);
    }

    private String extractRacePlayerToken(HttpServletRequest request) {
        if (request == null) {
            throw new ApiException(ErrorCode.RACE_PLAYER_TOKEN_MISSING);
        }

        return cookieUtils.getRacePlayerCookieValue(request)
                .filter(token -> !token.isBlank())
                .orElseThrow(() -> new ApiException(ErrorCode.RACE_PLAYER_TOKEN_MISSING));
    }

    private void validateRacePlayerToken(String token) {
        if (!jwtService.isTokenValid(token)) {
            throw new ApiException(ErrorCode.INVALID_RACE_PLAYER_TOKEN);
        }

        try {
            String tokenType = jwtService.extractTokenType(token);

            if (!JwtTokenTypes.RACE_PLAYER.equals(tokenType)) {
                throw new ApiException(ErrorCode.INVALID_RACE_PLAYER_TOKEN);
            }
        } catch (ApiException exception) {
            throw exception;
        } catch (RuntimeException exception) {
            throw new ApiException(ErrorCode.INVALID_RACE_PLAYER_TOKEN);
        }
    }

    private RacePlayerSessionIdentity extractRacePlayerIdentity(String token) {
        try {
            return new RacePlayerSessionIdentity(
                    jwtService.extractRaceId(token),
                    jwtService.extractRacePlayerId(token)
            );
        } catch (RuntimeException exception) {
            throw new ApiException(ErrorCode.INVALID_RACE_PLAYER_TOKEN);
        }
    }

    private RacePlayer findRacePlayerFromIdentity(RacePlayerSessionIdentity identity) {
        if (identity == null
                || identity.raceId() == null
                || identity.racePlayerId() == null) {
            throw new ApiException(ErrorCode.INVALID_RACE_PLAYER_TOKEN);
        }

        return racePlayerRepository.findByIdAndRaceId(
                        identity.racePlayerId(),
                        identity.raceId()
                )
                .orElseThrow(() -> new ApiException(ErrorCode.RACE_PLAYER_NOT_FOUND));
    }

    private void validateRacePlayerCanReceiveQuestion(RacePlayer racePlayer) {
        validateRacePlayerIsRacing(racePlayer);
        validateRaceIsInProgress(racePlayer);
    }

    private void validateRacePlayerIsRacing(RacePlayer racePlayer) {
        if (racePlayer.getStatus() != RacePlayerStatus.RACING) {
            throw new ApiException(ErrorCode.RACE_PLAYER_NOT_RACING);
        }
    }

    private void validateRaceIsInProgress(RacePlayer racePlayer) {
        Race race = racePlayer.getRace();

        if (race == null || race.getStatus() != RaceStatus.IN_PROGRESS) {
            throw new ApiException(ErrorCode.RACE_NOT_IN_PROGRESS);
        }
    }
}
