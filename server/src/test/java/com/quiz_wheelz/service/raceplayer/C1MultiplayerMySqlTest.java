package com.quiz_wheelz.service.raceplayer;

import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

@EnabledIfEnvironmentVariable(named = "QUIZWHEELZ_LUCK_MYSQL_TEST_URL",
        matches = "jdbc:mysql://127\\.0\\.0\\.1:[0-9]+/quizwheelz_s4_luck_test")
class C1MultiplayerMySqlTest extends C1MultiplayerAcceptanceTest {
    @DynamicPropertySource
    static void database(DynamicPropertyRegistry properties) {
        B1LuckAnswerMySqlTest.database(properties);
    }
}
