package com.quiz_wheelz.entitys;

import jakarta.persistence.Column;
import org.hibernate.annotations.ColumnDefault;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Field;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;

class RacePlayerFocusSchemaDefaultsTest {

    @Test
    void focusSummaryColumnsDeclareBackfillSafeDatabaseDefaults()
            throws NoSuchFieldException {
        assertDatabaseDefault("focusLossCount", "0");
        assertDatabaseDefault("focusState", "'VISIBLE'");
    }

    private void assertDatabaseDefault(String fieldName, String expectedDefault)
            throws NoSuchFieldException {
        Field field = RacePlayer.class.getDeclaredField(fieldName);
        Column column = field.getAnnotation(Column.class);
        ColumnDefault columnDefault = field.getAnnotation(ColumnDefault.class);

        assertNotNull(column);
        assertFalse(column.nullable());
        assertNotNull(columnDefault);
        assertEquals(expectedDefault, columnDefault.value());
    }
}
