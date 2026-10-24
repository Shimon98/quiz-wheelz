package com.quiz_wheelz.service.luck;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest(properties = {"spring.datasource.url=jdbc:h2:mem:luck-startup-verification;"
        + "MODE=MySQL;DB_CLOSE_DELAY=-1;DATABASE_TO_UPPER=false", "QUIZWHEELZ_LUCK_ANSWER_ENABLED=true"})
@ActiveProfiles("test")
class LuckStartupVerificationContextTest {
    @Autowired LuckPeerJdbcResources resources;

    @Test
    void luckOnVerifiesThePeerPoolAndBudgetBeforeAnyAnswer() {
        var pool = resources.snapshot();
        assertTrue(pool.started());
        assertEquals(0, pool.active());
    }
}
