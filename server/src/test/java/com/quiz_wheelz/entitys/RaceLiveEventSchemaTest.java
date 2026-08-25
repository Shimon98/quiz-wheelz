package com.quiz_wheelz.entitys;

import com.quiz_wheelz.enums.RaceLiveEventType;
import jakarta.persistence.Column;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Field;
import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;

class RaceLiveEventSchemaTest {

    @Test
    void vocabularyContainsExactlyTheApprovedSixValues() {
        assertEquals(
                List.of(
                        "PLAYER_JOINED",
                        "RACE_STARTED",
                        "QUESTION_ANSWERED",
                        "PLAYER_PROGRESS_UPDATED",
                        "PLAYER_FINISHED",
                        "RACE_FINISHED"
                ),
                Arrays.stream(RaceLiveEventType.values()).map(Enum::name).toList()
        );
    }

    @Test
    void entityDeclaresDurableTableUniquenessAndOrderedLookupIndex() {
        Table table = RaceLiveEvent.class.getAnnotation(Table.class);

        assertNotNull(table);
        assertEquals("race_live_events", table.name());
        assertEquals(1, table.uniqueConstraints().length);
        assertConstraint(table.uniqueConstraints()[0]);
        assertEquals(1, table.indexes().length);
        assertIndex(table.indexes()[0]);
    }

    @Test
    void everyDurableEventFieldIsRequired() throws NoSuchFieldException {
        Field race = RaceLiveEvent.class.getDeclaredField("race");
        Field version = RaceLiveEvent.class.getDeclaredField("version");
        Field type = RaceLiveEvent.class.getDeclaredField("type");
        Field occurredAt = RaceLiveEvent.class.getDeclaredField("occurredAtEpochMs");
        Field payload = RaceLiveEvent.class.getDeclaredField("payloadJson");

        assertNotNull(race.getAnnotation(NotNull.class));
        assertFalse(race.getAnnotation(JoinColumn.class).nullable());
        assertRequiredColumn(version);
        assertRequiredColumn(type);
        assertRequiredColumn(occurredAt);
        assertNotNull(payload.getAnnotation(NotBlank.class));
        Column payloadColumn = payload.getAnnotation(Column.class);
        assertNotNull(payloadColumn);
        assertFalse(payloadColumn.nullable());
    }

    private void assertConstraint(UniqueConstraint constraint) {
        assertEquals("uk_race_live_events_race_version", constraint.name());
        assertEquals(List.of("race_id", "version"), List.of(constraint.columnNames()));
    }

    private void assertIndex(Index index) {
        assertEquals("idx_race_live_events_race_version", index.name());
        assertEquals("race_id,version", index.columnList());
    }

    private void assertRequiredColumn(Field field) {
        assertNotNull(field.getAnnotation(NotNull.class));
        Column column = field.getAnnotation(Column.class);
        assertNotNull(column);
        assertFalse(column.nullable());
    }
}
