package com.quiz_wheelz.service;

import com.quiz_wheelz.entitys.RacePlayer;
import com.quiz_wheelz.enums.RacePlayerStatus;
import com.quiz_wheelz.exception.ApiException;
import com.quiz_wheelz.exception.ErrorCode;
import com.quiz_wheelz.repository.RacePlayerRepository;
import com.quiz_wheelz.security.JwtTokenTypes;
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
        String token = extractRacePlayerToken(request);
        validateRacePlayerToken(token);

        RacePlayer racePlayer = findRacePlayerFromToken(token);
        validateRacePlayerIsRacing(racePlayer);

        return racePlayer;
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

    private RacePlayer findRacePlayerFromToken(String token) {
        try {
            Long raceId = jwtService.extractRaceId(token);
            Long racePlayerId = jwtService.extractRacePlayerId(token);

            return racePlayerRepository.findByIdAndRaceId(racePlayerId, raceId)
                    .orElseThrow(() -> new ApiException(ErrorCode.RACE_PLAYER_NOT_FOUND));
        } catch (ApiException exception) {
            throw exception;
        } catch (RuntimeException exception) {
            throw new ApiException(ErrorCode.INVALID_RACE_PLAYER_TOKEN);
        }
    }

    private void validateRacePlayerIsRacing(RacePlayer racePlayer) {
        if (racePlayer.getStatus() != RacePlayerStatus.RACING) {
            throw new ApiException(ErrorCode.RACE_PLAYER_NOT_RACING);
        }
    }
}
