package com.quiz_wheelz.entitys;

import com.quiz_wheelz.enums.RaceFocusPolicy;
import jakarta.persistence.Column;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import org.hibernate.annotations.ColumnDefault;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Field;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;

class RaceFocusPolicySchemaDefaultsTest {

    @Test
    void focusPolicyDeclaresBackfillSafeDatabaseMetadata()
            throws NoSuchFieldException {
        Field field = Race.class.getDeclaredField("focusPolicy");
        Column column = field.getAnnotation(Column.class);
        Enumerated enumerated = field.getAnnotation(Enumerated.class);
        ColumnDefault columnDefault = field.getAnnotation(ColumnDefault.class);

        assertNotNull(column);
        assertEquals("focus_policy", column.name());
        assertFalse(column.nullable());
        assertNotNull(enumerated);
        assertEquals(EnumType.STRING, enumerated.value());
        assertNotNull(columnDefault);
        assertEquals("'WARN'", columnDefault.value());
        assertEquals(RaceFocusPolicy.WARN, new Race().getFocusPolicy());
    }
}
