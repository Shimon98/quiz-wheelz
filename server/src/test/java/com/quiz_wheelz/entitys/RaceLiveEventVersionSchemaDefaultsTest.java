package com.quiz_wheelz.entitys;

import jakarta.persistence.Column;
import jakarta.persistence.Version;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import org.hibernate.annotations.ColumnDefault;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Field;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;

class RaceLiveEventVersionSchemaDefaultsTest {

    @Test
    void liveEventVersionDeclaresBackfillSafeDatabaseMetadata()
            throws NoSuchFieldException {
        Field field = Race.class.getDeclaredField("liveEventVersion");
        Column column = field.getAnnotation(Column.class);
        ColumnDefault columnDefault = field.getAnnotation(ColumnDefault.class);

        assertNotNull(field.getAnnotation(NotNull.class));
        assertNotNull(field.getAnnotation(PositiveOrZero.class));
        assertNotNull(column);
        assertEquals("live_event_version", column.name());
        assertFalse(column.nullable());
        assertNotNull(columnDefault);
        assertEquals("0", columnDefault.value());
        assertNull(field.getAnnotation(Version.class));
        assertEquals(0L, new Race().getLiveEventVersion());
    }
}
