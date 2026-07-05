package com.quiz_wheelz.service.runtime;

import com.quiz_wheelz.config.RedisRuntimeConfig;
import com.quiz_wheelz.exception.ConfigurationException;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class RedisStartupVerifierTest {

    @Test
    void shouldSkipPingWhenRedisIsNotRequired() {
        RedisRuntimeConfig config = mock(RedisRuntimeConfig.class);
        RedisConnectionService connectionService = mock(RedisConnectionService.class);

        when(config.isRequired()).thenReturn(false);

        RedisStartupVerifier verifier = new RedisStartupVerifier(config, connectionService);

        verifier.run(null);

        verify(connectionService, never()).ping();
    }

    @Test
    void shouldPassWhenRequiredRedisResponds() {
        RedisRuntimeConfig config = mock(RedisRuntimeConfig.class);
        RedisConnectionService connectionService = mock(RedisConnectionService.class);

        when(config.isRequired()).thenReturn(true);
        when(connectionService.ping()).thenReturn(true);

        RedisStartupVerifier verifier = new RedisStartupVerifier(config, connectionService);

        verifier.run(null);
    }

    @Test
    void shouldFailWhenRequiredRedisDoesNotRespond() {
        RedisRuntimeConfig config = mock(RedisRuntimeConfig.class);
        RedisConnectionService connectionService = mock(RedisConnectionService.class);

        when(config.isRequired()).thenReturn(true);
        when(connectionService.ping()).thenReturn(false);

        RedisStartupVerifier verifier = new RedisStartupVerifier(config, connectionService);

        assertThrows(ConfigurationException.class, () -> verifier.run(null));
    }
}
