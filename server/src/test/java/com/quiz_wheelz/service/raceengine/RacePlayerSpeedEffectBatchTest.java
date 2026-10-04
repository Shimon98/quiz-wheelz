package com.quiz_wheelz.service.raceengine;

import com.quiz_wheelz.exception.ApiException;
import com.quiz_wheelz.exception.ErrorCode;
import com.quiz_wheelz.repository.RacePlayerSpeedEffectRepository;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.stream.LongStream;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class RacePlayerSpeedEffectBatchTest {

    private final RacePlayerSpeedEffectRepository repository = mock(RacePlayerSpeedEffectRepository.class);
    private final RacePlayerSpeedEffectService service = new RacePlayerSpeedEffectService(repository);

    @Test
    void emptyRosterRequiresNoSql() {
        assertTrue(service.findRelevantForPlayers(List.of(), 100, 200).isEmpty());
        verifyNoInteractions(repository);
    }

    @Test
    void maximumRaceSizeUsesOneExplicitlyBoundedQueryIncludingInstantWindows() {
        var ids = LongStream.rangeClosed(1, 8).boxed().toList();
        assertTrue(service.findRelevantForPlayers(ids, 100, 100).isEmpty());
        verify(repository).findRelevantForPlayers(ids, 100, 100);
        verifyNoMoreInteractions(repository);
    }

    @Test
    void largerThanRaceRosterIsRejectedBeforeSql() {
        var exception = assertThrows(ApiException.class, () ->
                service.findRelevantForPlayers(LongStream.rangeClosed(1, 9).boxed().toList(), 100, 200));
        assertEquals(ErrorCode.SPEED_EFFECT_INVALID, exception.getErrorCode());
        verifyNoInteractions(repository);
    }

    @Test
    void backwardTimeWindowIsRejectedBeforeSql() {
        var exception = assertThrows(ApiException.class, () ->
                service.findRelevantForPlayers(List.of(1L), 200, 100));
        assertEquals(ErrorCode.SPEED_EFFECT_INVALID, exception.getErrorCode());
        verifyNoInteractions(repository);
    }
}
