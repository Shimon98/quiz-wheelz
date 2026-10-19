package com.quiz_wheelz.service.luck;

import com.zaxxer.hikari.HikariDataSource;
import org.junit.jupiter.api.Test;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.concurrent.*;
import static org.junit.jupiter.api.Assertions.*;

class LuckPeerJdbcResourcesTest {
    private HikariDataSource writer() {
        var writer = new HikariDataSource();
        writer.setJdbcUrl("jdbc:h2:mem:resource-" + java.util.UUID.randomUUID() + ";MODE=MySQL");
        writer.setUsername("sa");
        writer.setMaximumPoolSize(2);
        writer.setMinimumIdle(0);
        return writer;
    }

    private LuckPeerJdbcResources reader(HikariDataSource writer, int maximum, long timeout, int instances, int budget) {
        return new LuckPeerJdbcResources(writer, "", maximum, timeout, 1, instances, budget, 10);
    }

    @Test
    void concurrentLazyCreationUsesOneBoundedPoolAndReturnsEveryConnection() throws Exception {
        try (var writer = writer(); var executor = Executors.newFixedThreadPool(8)) {
            var reader = reader(writer, 2, 3000, 2, 8);
            assertFalse(reader.snapshot().started());
            var ready = new CountDownLatch(8);
            var tasks = new ArrayList<Future<?>>();
            for (int index = 0; index < 8; index++) tasks.add(executor.submit(() -> {
                ready.countDown();
                assertTrue(ready.await(5, TimeUnit.SECONDS));
                try (var connection = reader.connection()) {
                    assertEquals(java.sql.Connection.TRANSACTION_READ_COMMITTED, connection.getTransactionIsolation());
                    assertTrue(connection.getAutoCommit());
                }
                return true;
            }));
            for (var task : tasks) assertEquals(true, task.get(10, TimeUnit.SECONDS));
            assertTrue(reader.snapshot().total() <= 2);
            assertEquals(0, reader.snapshot().active());
            reader.close();
            assertTrue(reader.snapshot().closed());
            assertThrows(IllegalStateException.class, reader::connection);
            assertNotNull(LuckPeerJdbcResources.class.getMethod("close").getAnnotation(jakarta.annotation.PreDestroy.class));
        }
    }

    @Test
    void acquisitionTimeoutIsBoundedAndQueryExceptionReleasesConnection() throws Exception {
        try (var writer = writer()) {
            var reader = reader(writer, 1, 250, 1, 3);
            try {
                try (var held = reader.connection()) {
                    long start = System.nanoTime();
                    assertThrows(java.sql.SQLTransientConnectionException.class, reader::connection);
                    long elapsed = TimeUnit.NANOSECONDS.toMillis(System.nanoTime() - start);
                    assertTrue(elapsed >= 200 && elapsed < 3000, "elapsed=" + elapsed);
                    assertEquals(1, reader.snapshot().active());
                }
                assertThrows(SQLException.class, () -> {
                    try (var connection = reader.connection(); var query = connection.createStatement()) {
                        query.setQueryTimeout(reader.queryTimeoutSeconds());
                        query.executeQuery("select missing_luck_column from missing_luck_table");
                    }
                });
                assertEquals(0, reader.snapshot().active());
                try (var next = reader.connection()) {
                    assertTrue(next.isValid(1));
                }
            } finally {
                reader.close();
            }
        }
    }

    @Test
    void invalidConfigurationAndCombinedDeploymentBudgetFailClosedBeforePoolCreation() throws Exception {
        try (var writer = writer()) {
            for (var reader : java.util.List.of(reader(writer, 0, 1000, 1, 64),
                    reader(writer, 1, 249, 1, 64), reader(writer, 1, 1000, 0, 64),
                    reader(writer, 1, 1000, 2, 5), reader(writer, 1, 1000, 1, 0),
                    new LuckPeerJdbcResources(writer, "", 1, 1000, 0, 1, 64, 10),
                    new LuckPeerJdbcResources(writer, "", 1, 1000, 1, 1, 64, 0))) {
                assertThrows(IllegalStateException.class, reader::connection);
                assertFalse(reader.snapshot().started());
                reader.close();
            }
        }
    }
}
