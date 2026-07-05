package com.quiz_wheelz.common.redis;

import com.quiz_wheelz.exception.ErrorMessages;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class RedisKeyIdentifierTest {

    @Test
    void shouldCreateRacePlayerIdentifier() {
        assertEquals("player-5", RedisKeyIdentifier.racePlayer(5L).value());
    }

    @Test
    void shouldCreateRaceIdentifier() {
        assertEquals("race-10", RedisKeyIdentifier.race(10L).value());
    }

    @Test
    void shouldNormalizeIpIdentifier() {
        assertEquals("ip-127_0_0_1", RedisKeyIdentifier.ipAddress("127.0.0.1").value());
    }

    @Test
    void shouldNormalizeUsernameIdentifier() {
        assertEquals("username-diana_test", RedisKeyIdentifier.username("Diana.Test").value());
    }

    @Test
    void shouldRejectUsernameWithInvalidKeyCharacters() {
        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> RedisKeyIdentifier.username("bad user")
        );

        assertEquals(ErrorMessages.REDIS_KEY_PART_INVALID, exception.getMessage());
    }

    @Test
    void shouldRejectIpAddressWithInvalidKeyCharacters() {
        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> RedisKeyIdentifier.ipAddress("127.0.0.1/24")
        );

        assertEquals(ErrorMessages.REDIS_KEY_PART_INVALID, exception.getMessage());
    }

    @Test
    void shouldRejectInvalidRacePlayerId() {
        assertThrows(IllegalArgumentException.class, () -> RedisKeyIdentifier.racePlayer(0L));
    }

    @Test
    void shouldRejectBlankIdentifier() {
        assertThrows(IllegalArgumentException.class, () -> new RedisKeyIdentifier(" "));
    }
}
