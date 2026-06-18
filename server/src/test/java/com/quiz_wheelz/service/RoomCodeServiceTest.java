package com.quiz_wheelz.service;

import com.quiz_wheelz.repository.RaceRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RoomCodeServiceTest {

    @Mock
    private RaceRepository raceRepository;

    @Test
    void shouldGenerateUniqueRoomCode() {
        RoomCodeService roomCodeService = new RoomCodeService(raceRepository);

        when(raceRepository.existsByRoomCode(org.mockito.ArgumentMatchers.anyString()))
                .thenReturn(false);

        String roomCode = roomCodeService.generateUniqueRoomCode();

        assertNotNull(roomCode);
        assertEquals(6, roomCode.length());
    }

    @Test
    void shouldGenerateOnlyAllowedCharacters() {
        RoomCodeService roomCodeService = new RoomCodeService(raceRepository);

        when(raceRepository.existsByRoomCode(org.mockito.ArgumentMatchers.anyString()))
                .thenReturn(false);

        String roomCode = roomCodeService.generateUniqueRoomCode();

        assertTrue(roomCode.matches("[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}"));
    }
}