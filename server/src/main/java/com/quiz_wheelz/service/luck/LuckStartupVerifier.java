package com.quiz_wheelz.service.luck;

import com.quiz_wheelz.config.ConfigPropertyKeys;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.sql.SQLException;
import java.util.Objects;

@Component
@ConditionalOnProperty(name = ConfigPropertyKeys.QUIZWHEELZ_LUCK_ANSWER_ENABLED, havingValue = "true")
public class LuckStartupVerifier implements ApplicationRunner {

    private final LuckPeerJdbcResources peerResources;

    public LuckStartupVerifier(LuckPeerJdbcResources peerResources) {
        this.peerResources = Objects.requireNonNull(peerResources);
    }

    @Override
    public void run(ApplicationArguments args) throws SQLException {
        peerResources.verifyBeforeServing();
    }
}
