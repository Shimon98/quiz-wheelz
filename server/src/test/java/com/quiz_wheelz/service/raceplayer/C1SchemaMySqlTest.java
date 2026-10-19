package com.quiz_wheelz.service.raceplayer;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import java.nio.file.*;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;

@EnabledIfEnvironmentVariable(named = "QUIZWHEELZ_LUCK_MYSQL_TEST_URL",
        matches = "jdbc:mysql://127\\.0\\.0\\.1:[0-9]+/quizwheelz_s4_luck_test")
class C1SchemaMySqlTest extends B1LuckIntegrationFixture {
    @DynamicPropertySource
    static void database(DynamicPropertyRegistry properties) {
        B1LuckAnswerMySqlTest.database(properties);
    }

    @Test
    void recordActualDisposableSchemaForNonExecutedMigrationCompatibilityReview() throws Exception {
        var ddl = new LinkedHashMap<String, String>();
        transactions.executeWithoutResult(status -> entityManager.unwrap(org.hibernate.Session.class).doWork(connection -> {
            assertEquals("MySQL", connection.getMetaData().getDatabaseProductName());
            assertTrue(connection.getMetaData().getURL().endsWith("/quizwheelz_s4_luck_test"));
            try (var statement = connection.createStatement()) {
                for (String table : List.of("race_player_gameplay_states", "race_luck_fairness_states", "race_player_luck_decisions")) {
                    try (var rows = statement.executeQuery("show create table " + table)) {
                        assertTrue(rows.next());
                        ddl.put(table, rows.getString(2));
                    }
                }
            }
        }));
        Files.createDirectories(Path.of("target", "c1-evidence"));
        Files.writeString(Path.of("target", "c1-evidence", "disposable-schema.json"),
                new ObjectMapper().writerWithDefaultPrettyPrinter().writeValueAsString(ddl));
    }
}
