package com.quiz_wheelz.service;

import com.quiz_wheelz.entitys.Race;
import com.quiz_wheelz.entitys.RacePlayer;
import com.quiz_wheelz.enums.RacePlayerStatus;
import com.quiz_wheelz.enums.RaceStatus;
import com.quiz_wheelz.exception.ApiException;
import com.quiz_wheelz.exception.ErrorCode;
import com.quiz_wheelz.repository.RacePlayerRepository;
import com.quiz_wheelz.security.JwtTokenTypes;
import com.quiz_wheelz.utils.CookieUtils;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CurrentRacePlayerServiceTest {

    private static final String TOKEN = "race-player-token";
    private static final long RACE_ID = 10L;
    private static final long RACE_PLAYER_ID = 20L;

    @Mock
    private CookieUtils cookieUtils;

    @Mock
    private JwtService jwtService;

    @Mock
    private RacePlayerRepository racePlayerRepository;

    @Mock
    private HttpServletRequest request;

    @Test
    void shouldResolveCurrentRacePlayerFromValidCookieToken() {
        CurrentRacePlayerService service = createService();
        RacePlayer racePlayer = createRacePlayer(RacePlayerStatus.RACING);

        mockValidTokenResolvingTo(racePlayer);

        RacePlayer result = service.resolveCurrentRacePlayer(request);

        assertSame(racePlayer, result);
    }

    @Test
    void shouldRejectMissingRequest() {
        ApiException exception = assertThrows(
                ApiException.class,
                () -> createService().resolveCurrentRacePlayer(null)
        );

        assertEquals(ErrorCode.RACE_PLAYER_TOKEN_MISSING, exception.getErrorCode());
    }

    @Test
    void shouldRejectMissingRacePlayerCookie() {
        when(cookieUtils.getRacePlayerCookieValue(request)).thenReturn(Optional.empty());

        ApiException exception = assertThrows(
                ApiException.class,
                () -> createService().resolveCurrentRacePlayer(request)
        );

        assertEquals(ErrorCode.RACE_PLAYER_TOKEN_MISSING, exception.getErrorCode());
    }

    @Test
    void shouldRejectBlankRacePlayerCookie() {
        when(cookieUtils.getRacePlayerCookieValue(request)).thenReturn(Optional.of(" "));

        ApiException exception = assertThrows(
                ApiException.class,
                () -> createService().resolveCurrentRacePlayer(request)
        );

        assertEquals(ErrorCode.RACE_PLAYER_TOKEN_MISSING, exception.getErrorCode());
    }

    @Test
    void shouldRejectInvalidToken() {
        when(cookieUtils.getRacePlayerCookieValue(request)).thenReturn(Optional.of(TOKEN));
        when(jwtService.isTokenValid(TOKEN)).thenReturn(false);

        ApiException exception = assertThrows(
                ApiException.class,
                () -> createService().resolveCurrentRacePlayer(request)
        );

        assertEquals(ErrorCode.INVALID_RACE_PLAYER_TOKEN, exception.getErrorCode());
    }

    @Test
    void shouldRejectNonRacePlayerToken() {
        when(cookieUtils.getRacePlayerCookieValue(request)).thenReturn(Optional.of(TOKEN));
        when(jwtService.isTokenValid(TOKEN)).thenReturn(true);
        when(jwtService.extractTokenType(TOKEN)).thenReturn(JwtTokenTypes.AUTH_USER);

        ApiException exception = assertThrows(
                ApiException.class,
                () -> createService().resolveCurrentRacePlayer(request)
        );

        assertEquals(ErrorCode.INVALID_RACE_PLAYER_TOKEN, exception.getErrorCode());
    }

    @Test
    void shouldRejectMissingRacePlayer() {
        when(cookieUtils.getRacePlayerCookieValue(request)).thenReturn(Optional.of(TOKEN));
        when(jwtService.isTokenValid(TOKEN)).thenReturn(true);
        when(jwtService.extractTokenType(TOKEN)).thenReturn(JwtTokenTypes.RACE_PLAYER);
        when(jwtService.extractRaceId(TOKEN)).thenReturn(RACE_ID);
        when(jwtService.extractRacePlayerId(TOKEN)).thenReturn(RACE_PLAYER_ID);
        when(racePlayerRepository.findByIdAndRaceId(RACE_PLAYER_ID, RACE_ID))
                .thenReturn(Optional.empty());

        ApiException exception = assertThrows(
                ApiException.class,
                () -> createService().resolveCurrentRacePlayer(request)
        );

        assertEquals(ErrorCode.RACE_PLAYER_NOT_FOUND, exception.getErrorCode());
    }

    @Test
    void shouldRejectRacePlayerThatIsNotRacing() {
        RacePlayer racePlayer = createRacePlayer(RacePlayerStatus.WAITING);

        mockValidTokenResolvingTo(racePlayer);

        ApiException exception = assertThrows(
                ApiException.class,
                () -> createService().resolveCurrentRacePlayer(request)
        );

        assertEquals(ErrorCode.RACE_PLAYER_NOT_RACING, exception.getErrorCode());
    }

    @Test
    void shouldRejectRacePlayerWithoutRace() {
        RacePlayer racePlayer = new RacePlayer();
        racePlayer.setStatus(RacePlayerStatus.RACING);

        mockValidTokenResolvingTo(racePlayer);

        ApiException exception = assertThrows(
                ApiException.class,
                () -> createService().resolveCurrentRacePlayer(request)
        );

        assertEquals(ErrorCode.RACE_NOT_IN_PROGRESS, exception.getErrorCode());
    }

    @Test
    void shouldRejectRaceWhenRaceIsNotInProgress() {
        RacePlayer racePlayer = createRacePlayer(
                RacePlayerStatus.RACING,
                RaceStatus.WAITING_FOR_PLAYERS
        );

        mockValidTokenResolvingTo(racePlayer);

        ApiException exception = assertThrows(
                ApiException.class,
                () -> createService().resolveCurrentRacePlayer(request)
        );

        assertEquals(ErrorCode.RACE_NOT_IN_PROGRESS, exception.getErrorCode());
    }

    @Test
    void shouldResolveRacePlayerOnlyWhenPlayerIsRacingAndRaceIsInProgress() {
        RacePlayer racePlayer = createRacePlayer(
                RacePlayerStatus.RACING,
                RaceStatus.IN_PROGRESS
        );

        mockValidTokenResolvingTo(racePlayer);

        RacePlayer result = createService().resolveCurrentRacePlayer(request);

        assertSame(racePlayer, result);
    }

    private CurrentRacePlayerService createService() {
        return new CurrentRacePlayerService(
                cookieUtils,
                jwtService,
                racePlayerRepository
        );
    }

    private void mockValidTokenResolvingTo(RacePlayer racePlayer) {
        when(cookieUtils.getRacePlayerCookieValue(request)).thenReturn(Optional.of(TOKEN));
        when(jwtService.isTokenValid(TOKEN)).thenReturn(true);
        when(jwtService.extractTokenType(TOKEN)).thenReturn(JwtTokenTypes.RACE_PLAYER);
        when(jwtService.extractRaceId(TOKEN)).thenReturn(RACE_ID);
        when(jwtService.extractRacePlayerId(TOKEN)).thenReturn(RACE_PLAYER_ID);
        when(racePlayerRepository.findByIdAndRaceId(RACE_PLAYER_ID, RACE_ID))
                .thenReturn(Optional.of(racePlayer));
    }

    private RacePlayer createRacePlayer(RacePlayerStatus playerStatus) {
        return createRacePlayer(playerStatus, RaceStatus.IN_PROGRESS);
    }

    private RacePlayer createRacePlayer(
            RacePlayerStatus playerStatus,
            RaceStatus raceStatus
    ) {
        Race race = new Race();
        race.setStatus(raceStatus);

        RacePlayer racePlayer = new RacePlayer();
        racePlayer.setStatus(playerStatus);
        racePlayer.setRace(race);

        return racePlayer;
    }
}
