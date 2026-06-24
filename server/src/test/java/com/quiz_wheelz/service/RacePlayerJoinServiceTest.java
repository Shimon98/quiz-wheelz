package com.quiz_wheelz.service;

import com.quiz_wheelz.common.RacePlayerRules;
import com.quiz_wheelz.dto.raceplayer.RacePlayerJoinRequest;
import com.quiz_wheelz.dto.raceplayer.RacePlayerJoinResult;
import com.quiz_wheelz.entitys.Race;
import com.quiz_wheelz.entitys.RacePlayer;
import com.quiz_wheelz.enums.RacePlayerStatus;
import com.quiz_wheelz.enums.RaceStatus;
import com.quiz_wheelz.exception.ApiException;
import com.quiz_wheelz.exception.ErrorCode;
import com.quiz_wheelz.repository.RacePlayerRepository;
import com.quiz_wheelz.repository.RaceRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RacePlayerJoinServiceTest {

    @Mock
    private RaceRepository raceRepository;

    @Mock
    private RacePlayerRepository racePlayerRepository;

    @Mock
    private JwtService jwtService;

    @InjectMocks
    private RacePlayerJoinService racePlayerJoinService;

    @Test
    void shouldJoinWaitingRaceAndCreateRacePlayerToken() {
        Race race = race(10L, "ABC123", RaceStatus.WAITING_FOR_PLAYERS, 4);
        RacePlayer existingPlayer = racePlayer(race, 1);

        when(raceRepository.findByRoomCodeForUpdate("ABC123")).thenReturn(Optional.of(race));
        when(racePlayerRepository.countByRace(race)).thenReturn(1L, 2L);
        when(racePlayerRepository.existsByRaceAndDisplayNameIgnoreCase(race, "Noa Cohen"))
                .thenReturn(false);
        when(racePlayerRepository.findByRaceOrderByLaneNumberAsc(race))
                .thenReturn(List.of(existingPlayer));
        when(racePlayerRepository.save(any(RacePlayer.class))).thenAnswer(invocation -> {
            RacePlayer player = invocation.getArgument(0);
            player.setId(20L);
            return player;
        });
        when(jwtService.createRacePlayerToken(10L, 20L, "Noa Cohen")).thenReturn("race-token");

        RacePlayerJoinResult result = racePlayerJoinService.joinRace(
                joinRequest(" abc123 ", "  Noa   Cohen  ")
        );

        assertNotNull(result);
        assertEquals("race-token", result.getRacePlayerToken());
        assertEquals(10L, result.getResponse().getRaceId());
        assertEquals("ABC123", result.getResponse().getRoomCode());
        assertEquals(2L, result.getResponse().getCurrentPlayers());
        assertEquals(20L, result.getResponse().getPlayer().getPlayerId());
        assertEquals("Noa Cohen", result.getResponse().getPlayer().getDisplayName());
        assertEquals(2, result.getResponse().getPlayer().getLaneNumber());
        assertEquals(RacePlayerRules.DEFAULT_VEHICLE_TYPE_KEY,
                result.getResponse().getPlayer().getVehicleTypeKey());
        assertEquals("RED", result.getResponse().getPlayer().getVehicleColorKey());
        assertEquals("TOY_CAR_RED", result.getResponse().getPlayer().getVehicleAssetKey());
        assertEquals(RacePlayerStatus.WAITING.name(), result.getResponse().getPlayer().getStatus());

        ArgumentCaptor<RacePlayer> playerCaptor = ArgumentCaptor.forClass(RacePlayer.class);
        verify(racePlayerRepository).save(playerCaptor.capture());
        RacePlayer savedPlayer = playerCaptor.getValue();

        assertSame(race, savedPlayer.getRace());
        assertEquals("Noa Cohen", savedPlayer.getDisplayName());
        assertEquals(2, savedPlayer.getLaneNumber());
        assertEquals(RacePlayerStatus.WAITING, savedPlayer.getStatus());
        verify(jwtService).createRacePlayerToken(10L, 20L, "Noa Cohen");
    }

    @Test
    void shouldRejectMissingRace() {
        when(raceRepository.findByRoomCodeForUpdate("ABC123")).thenReturn(Optional.empty());

        ApiException exception = assertThrows(
                ApiException.class,
                () -> racePlayerJoinService.joinRace(joinRequest("ABC123", "Noa"))
        );

        assertEquals(ErrorCode.RACE_NOT_FOUND, exception.getErrorCode());
        verify(racePlayerRepository, never()).save(any());
    }

    @Test
    void shouldRejectRaceThatIsNotWaitingForPlayers() {
        Race race = race(10L, "ABC123", RaceStatus.IN_PROGRESS, 4);
        when(raceRepository.findByRoomCodeForUpdate("ABC123")).thenReturn(Optional.of(race));

        ApiException exception = assertThrows(
                ApiException.class,
                () -> racePlayerJoinService.joinRace(joinRequest("ABC123", "Noa"))
        );

        assertEquals(ErrorCode.RACE_NOT_JOINABLE, exception.getErrorCode());
        verify(racePlayerRepository, never()).save(any());
    }

    @Test
    void shouldRejectFullRace() {
        Race race = race(10L, "ABC123", RaceStatus.WAITING_FOR_PLAYERS, 2);
        when(raceRepository.findByRoomCodeForUpdate("ABC123")).thenReturn(Optional.of(race));
        when(racePlayerRepository.countByRace(race)).thenReturn(2L);

        ApiException exception = assertThrows(
                ApiException.class,
                () -> racePlayerJoinService.joinRace(joinRequest("ABC123", "Noa"))
        );

        assertEquals(ErrorCode.RACE_FULL, exception.getErrorCode());
        verify(racePlayerRepository, never()).save(any());
    }

    @Test
    void shouldRejectTakenDisplayNameIgnoringCase() {
        Race race = race(10L, "ABC123", RaceStatus.WAITING_FOR_PLAYERS, 4);
        when(raceRepository.findByRoomCodeForUpdate("ABC123")).thenReturn(Optional.of(race));
        when(racePlayerRepository.countByRace(race)).thenReturn(1L);
        when(racePlayerRepository.existsByRaceAndDisplayNameIgnoreCase(race, "Noa"))
                .thenReturn(true);

        ApiException exception = assertThrows(
                ApiException.class,
                () -> racePlayerJoinService.joinRace(joinRequest("ABC123", "Noa"))
        );

        assertEquals(ErrorCode.RACE_PLAYER_NAME_TAKEN, exception.getErrorCode());
        verify(racePlayerRepository, never()).save(any());
    }

    private RacePlayerJoinRequest joinRequest(String roomCode, String displayName) {
        RacePlayerJoinRequest request = new RacePlayerJoinRequest();
        request.setRoomCode(roomCode);
        request.setDisplayName(displayName);
        return request;
    }

    private Race race(Long id, String roomCode, RaceStatus status, Integer maxPlayers) {
        Race race = new Race();
        race.setId(id);
        race.setTitle("Math Race");
        race.setRoomCode(roomCode);
        race.setStatus(status);
        race.setMaxPlayers(maxPlayers);
        return race;
    }

    private RacePlayer racePlayer(Race race, Integer laneNumber) {
        RacePlayer player = new RacePlayer();
        player.setRace(race);
        player.setLaneNumber(laneNumber);
        player.setDisplayName("Player " + laneNumber);
        return player;
    }
}
