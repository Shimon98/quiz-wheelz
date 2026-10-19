package com.quiz_wheelz.service.raceplayer;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import javax.sql.DataSource;
import static org.junit.jupiter.api.Assertions.*;

@EnabledIfEnvironmentVariable(named = "QUIZWHEELZ_LUCK_MYSQL_TEST_URL",
        matches = "jdbc:mysql://127\\.0\\.0\\.1:[0-9]+/quizwheelz_s4_luck_test")
@org.springframework.context.annotation.Import(RacePlayerHeartbeatService.class)
class B2LuckSnapshotMySqlTest extends B2LuckSnapshotIntegrationTest {
    @Autowired DataSource source;
    @Autowired RacePlayerHeartbeatService heartbeat;

    @DynamicPropertySource
    static void database(DynamicPropertyRegistry properties) {
        B1LuckAnswerMySqlTest.database(properties);
    }

    @BeforeEach
    void verifyMySql() throws Exception {
        try (var connection = source.getConnection()) {
            assertEquals("MySQL", connection.getMetaData().getDatabaseProductName());
            assertEquals(java.sql.Connection.TRANSACTION_REPEATABLE_READ, connection.getTransactionIsolation());
        }
    }

    @org.junit.jupiter.api.Test
    void answerSerializesConcurrentStateAndReconnectWhileHeartbeatCannotDraw() throws Exception {
        prepare("TAILWIND");
        org.mockito.Mockito.when(redisPresenceService.renewExistingPresenceLease(
                org.mockito.ArgumentMatchers.eq(raceId), org.mockito.ArgumentMatchers.eq(secondId),
                org.mockito.ArgumentMatchers.any())).thenReturn(true);
        var pending = new java.util.concurrent.CountDownLatch(1);
        var release = new java.util.concurrent.CountDownLatch(1);
        var readers = new java.util.concurrent.CountDownLatch(3);
        try (var executor = java.util.concurrent.Executors.newFixedThreadPool(4)) {
            var answer = executor.submit(() -> transactions.execute(status -> {
                var snapshot = submit(false).getRaceImpact().getSnapshot();
                entityManager.flush();
                pending.countDown();
                await(release);
                return snapshot;
            }));
            assertTrue(pending.await(15, java.util.concurrent.TimeUnit.SECONDS));
            var state = executor.submit(() -> { readers.countDown(); return snapshot(); });
            var reconnecting = executor.submit(() -> { readers.countDown(); return reconnect.reconnect(secondRequest); });
            var beating = executor.submit(() -> { readers.countDown(); return heartbeat.heartbeat(secondRequest); });
            try {
                assertTrue(readers.await(10, java.util.concurrent.TimeUnit.SECONDS));
                boolean observed = false;
                long deadline = System.nanoTime() + java.util.concurrent.TimeUnit.SECONDS.toNanos(10);
                try (var connection = source.getConnection(); var query = connection.createStatement()) {
                    query.setQueryTimeout(2);
                    while (System.nanoTime() < deadline) {
                        try (var result = query.executeQuery("select count(*) from performance_schema.data_lock_waits")) {
                            assertTrue(result.next());
                            if (result.getInt(1) >= 2) { observed = true; break; }
                        }
                        Thread.yield();
                    }
                }
                assertTrue(observed, "GET and reconnect must actually wait on the answer's player lock");
                assertFalse(state.isDone());
                assertFalse(reconnecting.isDone());
            } finally {
                release.countDown();
            }
            var accepted = answer.get(20, java.util.concurrent.TimeUnit.SECONDS);
            assertEquals(accepted.getGameplay(), state.get(20, java.util.concurrent.TimeUnit.SECONDS).getGameplay());
            assertNotNull(reconnecting.get(20, java.util.concurrent.TimeUnit.SECONDS));
            assertNotNull(beating.get(20, java.util.concurrent.TimeUnit.SECONDS));
            assertEquals(accepted.getGameplay(), snapshot().getGameplay());
            assertEquals(1, history().size());
            org.mockito.Mockito.verify(random, org.mockito.Mockito.times(2)).nextDouble();
        }
    }

    private static void await(java.util.concurrent.CountDownLatch latch) {
        try {
            assertTrue(latch.await(15, java.util.concurrent.TimeUnit.SECONDS));
        } catch (InterruptedException error) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException(error);
        }
    }
}
