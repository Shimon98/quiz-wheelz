package com.quiz_wheelz.service.raceplayer;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import javax.sql.DataSource;
import java.sql.Connection;
import static org.junit.jupiter.api.Assertions.*;

@EnabledIfEnvironmentVariable(named = "QUIZWHEELZ_LUCK_MYSQL_TEST_URL",
        matches = "jdbc:mysql://127\\.0\\.0\\.1:[0-9]+/quizwheelz_s4_luck_test")
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class B1LuckRollbackMySqlTest extends B1LuckAnswerRollbackTest {
    @Autowired DataSource source;

    @DynamicPropertySource
    static void database(DynamicPropertyRegistry properties) {
        properties.add("spring.datasource.url", () -> System.getenv("QUIZWHEELZ_LUCK_MYSQL_TEST_URL"));
        properties.add("spring.datasource.username", () -> System.getenv("QUIZWHEELZ_LUCK_MYSQL_TEST_USER"));
        properties.add("spring.datasource.password", () -> System.getenv("QUIZWHEELZ_LUCK_MYSQL_TEST_PASSWORD"));
        properties.add("spring.datasource.driver-class-name", () -> "com.mysql.cj.jdbc.Driver");
    }

    @BeforeEach
    void verifyMySql() throws Exception {
        try (var connection = source.getConnection()) {
            assertEquals("MySQL", connection.getMetaData().getDatabaseProductName());
            assertEquals(Connection.TRANSACTION_REPEATABLE_READ, connection.getTransactionIsolation());
        }
    }
}
