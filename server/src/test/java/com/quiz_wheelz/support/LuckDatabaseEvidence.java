package com.quiz_wheelz.support;

import jakarta.persistence.EntityManager;
import org.hibernate.engine.spi.SessionFactoryImplementor;
import static org.junit.jupiter.api.Assertions.*;

public final class LuckDatabaseEvidence {
    private LuckDatabaseEvidence() {
    }

    public static void verify(EntityManager em) {
        var dialect = em.getEntityManagerFactory().unwrap(SessionFactoryImplementor.class)
                .getJdbcServices().getDialect().getClass().getSimpleName();
        em.unwrap(org.hibernate.Session.class).doWork(connection -> {
            String url = connection.getMetaData().getURL();
            if ("H2".equals(connection.getMetaData().getDatabaseProductName())) {
                assertTrue(url.startsWith("jdbc:h2:mem:luck-"), url);
                assertEquals("H2Dialect", dialect);
                try (var statement = connection.createStatement();
                     var rows = statement.executeQuery("select SETTING_VALUE from INFORMATION_SCHEMA.SETTINGS where SETTING_NAME = 'MODE'")) {
                    assertTrue(rows.next());
                    assertEquals("MySQL", rows.getString(1));
                }
                System.out.println("LUCK_DATABASE url=" + url + " mode=MySQL dialect=" + dialect);
            } else {
                assertTrue(url.matches("jdbc:mysql://127\\.0\\.0\\.1:[0-9]+/quizwheelz_s4_luck_test"));
                assertEquals("MySQLDialect", dialect);
                assertEquals(java.sql.Connection.TRANSACTION_REPEATABLE_READ, connection.getTransactionIsolation());
                System.out.println("LUCK_DATABASE url=" + url + " isolation=RR dialect=" + dialect);
            }
        });
    }
}
