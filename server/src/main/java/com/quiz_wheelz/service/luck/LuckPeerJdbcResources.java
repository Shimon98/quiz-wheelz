package com.quiz_wheelz.service.luck;

import com.quiz_wheelz.config.ConfigPropertyKeys;
import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import jakarta.annotation.PreDestroy;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.SQLException;

@Component
public class LuckPeerJdbcResources {
    private static final String POOL_NAME = "quizwheelz-luck-peer";
    private final DataSource primary;
    private final String fallbackPassword;
    private final int maximum;
    private final long acquisitionTimeout;
    private final int queryTimeout;
    private final int instances;
    private final int budget;
    private final int reserved;
    private HikariDataSource pool;
    private boolean closed;
    private volatile boolean serverBudgetVerified;

    public LuckPeerJdbcResources(DataSource primary,
            @Value("${spring.datasource.password:}") String fallbackPassword,
            @Value("${" + ConfigPropertyKeys.QUIZWHEELZ_LUCK_PEER_POOL_MAX_SIZE + ":2}") int maximum,
            @Value("${" + ConfigPropertyKeys.QUIZWHEELZ_LUCK_PEER_ACQUIRE_TIMEOUT_MS + ":2000}") long acquisitionTimeout,
            @Value("${" + ConfigPropertyKeys.QUIZWHEELZ_LUCK_PEER_QUERY_TIMEOUT_SECONDS + ":2}") int queryTimeout,
            @Value("${" + ConfigPropertyKeys.QUIZWHEELZ_DB_MAX_APPLICATION_INSTANCES + ":0}") int instances,
            @Value("${" + ConfigPropertyKeys.QUIZWHEELZ_DB_APPLICATION_CONNECTION_BUDGET + ":0}") int budget,
            @Value("${" + ConfigPropertyKeys.QUIZWHEELZ_DB_RESERVED_CONNECTIONS + ":0}") int reserved) {
        this.primary = primary;
        this.fallbackPassword = fallbackPassword;
        this.maximum = maximum;
        this.acquisitionTimeout = acquisitionTimeout;
        this.queryTimeout = queryTimeout;
        this.instances = instances;
        this.budget = budget;
        this.reserved = reserved;
    }

    public Connection connection() throws SQLException {
        Connection connection = obtainPool().getConnection();
        try {
            verifyServerBudget(connection);
            return connection;
        } catch (SQLException | RuntimeException error) {
            connection.close();
            throw error;
        }
    }

    public int queryTimeoutSeconds() {
        return queryTimeout;
    }

    private synchronized HikariDataSource obtainPool() throws SQLException {
        if (closed) throw new IllegalStateException("Luck peer pool is closed");
        if (pool != null) return pool;
        if (maximum <= 0 || acquisitionTimeout < 250 || queryTimeout <= 0
                || instances <= 0 || budget <= 0 || reserved <= 0) {
            throw new IllegalStateException("Luck peer limits and deployment connection budget must be explicitly valid");
        }
        HikariConfig config = new HikariConfig();
        int writerMaximum = 0;
        if (primary instanceof HikariDataSource writer) {
            if (writer.getJdbcUrl() == null) throw new IllegalStateException("Luck peer pool requires a primary JDBC URL");
            writerMaximum = writer.getMaximumPoolSize();
            config.setJdbcUrl(writer.getJdbcUrl());
            config.setUsername(writer.getUsername());
            config.setPassword(writer.getPassword());
            config.setDataSourceProperties(writer.getDataSourceProperties());
        } else {
            try (var connection = primary.getConnection()) {
                if (!"H2".equals(connection.getMetaData().getDatabaseProductName())) {
                    throw new IllegalStateException("Luck peer pool requires the authoritative primary Hikari datasource");
                }
                config.setJdbcUrl(connection.getMetaData().getURL());
                config.setUsername(connection.getMetaData().getUserName());
                config.setPassword(fallbackPassword);
            }
        }
        if ((long) instances * (writerMaximum + (long) maximum) > budget) {
            throw new IllegalStateException("Combined writer and peer pool maxima exceed the application connection budget");
        }
        config.setPoolName(POOL_NAME);
        config.setMaximumPoolSize(maximum);
        config.setMinimumIdle(0);
        config.setConnectionTimeout(acquisitionTimeout);
        config.setValidationTimeout(Math.min(1000, acquisitionTimeout));
        config.setTransactionIsolation("TRANSACTION_READ_COMMITTED");
        config.setReadOnly(true);
        config.setAutoCommit(true);
        config.setInitializationFailTimeout(-1);
        pool = new HikariDataSource(config);
        return pool;
    }

    private synchronized void verifyServerBudget(Connection connection) throws SQLException {
        if (serverBudgetVerified) return;
        if ("MySQL".equals(connection.getMetaData().getDatabaseProductName())) {
            try (var statement = connection.createStatement()) {
                statement.setQueryTimeout(queryTimeout);
                try (var rows = statement.executeQuery("select @@max_connections")) {
                    if (!rows.next() || (long) budget + reserved > rows.getLong(1)) {
                        throw new IllegalStateException("Application budget plus reserved connections exceeds MySQL max_connections");
                    }
                }
            }
        }
        serverBudgetVerified = true;
    }

    public synchronized PoolState snapshot() {
        var metrics = pool == null ? null : pool.getHikariPoolMXBean();
        return new PoolState(pool != null, closed, maximum, metrics == null ? 0 : metrics.getTotalConnections(),
                metrics == null ? 0 : metrics.getActiveConnections(), metrics == null ? 0 : metrics.getIdleConnections(),
                metrics == null ? 0 : metrics.getThreadsAwaitingConnection());
    }

    @PreDestroy
    public synchronized void close() {
        closed = true;
        if (pool != null) pool.close();
    }

    public record PoolState(boolean started, boolean closed, int maximum, int total, int active, int idle, int waiting) {
    }
}
