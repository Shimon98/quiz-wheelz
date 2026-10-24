package com.quiz_wheelz.service.luck;

import com.quiz_wheelz.config.ConfigPropertyKeys;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

class LuckStartupVerifierTest {
    private final ApplicationContextRunner contexts = new ApplicationContextRunner()
            .withUserConfiguration(LuckStartupVerifier.class);

    @Test
    void luckOffRegistersNoVerifierAndNeedsNoLuckResources() {
        contexts.run(context -> assertThat(context).hasNotFailed().doesNotHaveBean(LuckStartupVerifier.class));
        contexts.withPropertyValues(ConfigPropertyKeys.QUIZWHEELZ_LUCK_ANSWER_ENABLED + "=false")
                .run(context -> assertThat(context).hasNotFailed().doesNotHaveBean(LuckStartupVerifier.class));
    }

    @Test
    void luckOnRegistersTheVerifier() {
        contexts.withPropertyValues(ConfigPropertyKeys.QUIZWHEELZ_LUCK_ANSWER_ENABLED + "=true")
                .withBean(LuckPeerJdbcResources.class, () -> mock(LuckPeerJdbcResources.class))
                .run(context -> assertThat(context).hasSingleBean(LuckStartupVerifier.class));
    }

    @Test
    void verifierChecksThePeerPoolAndDeploymentBudgetBeforeServing() throws Exception {
        var resources = mock(LuckPeerJdbcResources.class);
        new LuckStartupVerifier(resources).run(null);
        verify(resources).verifyBeforeServing();
    }

    @Test
    void invalidPeerLimitsOrBudgetStopTheStartup() throws Exception {
        var resources = mock(LuckPeerJdbcResources.class);
        doThrow(new IllegalStateException("budget")).when(resources).verifyBeforeServing();
        assertThrows(IllegalStateException.class, () -> new LuckStartupVerifier(resources).run(null));
    }
}
