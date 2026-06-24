package com.quiz_wheelz.service;

import com.quiz_wheelz.common.RaceRules;
import com.quiz_wheelz.exception.ApiException;
import com.quiz_wheelz.exception.ErrorCode;
import com.quiz_wheelz.repository.RaceRepository;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;

@Service
public class RoomCodeService {

    private static final String ALLOWED_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final int MAX_ATTEMPTS = 20;

    private final RaceRepository raceRepository;
    private final SecureRandom secureRandom = new SecureRandom();

    public RoomCodeService(RaceRepository raceRepository) {
        this.raceRepository = raceRepository;
    }

    public String generateUniqueRoomCode() {
        for (int attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
            String roomCode = generateRoomCode();

            if (!raceRepository.existsByRoomCode(roomCode)) {
                return roomCode;
            }
        }

        throw new ApiException(ErrorCode.ROOM_CODE_GENERATION_FAILED);
    }

    private String generateRoomCode() {
        StringBuilder code = new StringBuilder(RaceRules.ROOM_CODE_LENGTH);

        for (int i = 0; i < RaceRules.ROOM_CODE_LENGTH; i++) {
            int index = secureRandom.nextInt(ALLOWED_CHARS.length());
            code.append(ALLOWED_CHARS.charAt(index));
        }

        return code.toString();
    }
}