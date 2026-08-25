package com.quiz_wheelz.service.raceplayer;

import com.quiz_wheelz.dto.raceplayer.RacePlayerSessionIdentity;
import com.quiz_wheelz.entitys.RacePlayer;
import com.quiz_wheelz.repository.RacePlayerRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.Test;
import org.mockito.InOrder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertSame;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class RacePlayerSessionLockServiceTest {

    @Test
    void resolveAndLockUsesTokenIdentityWithoutOrdinaryPlayerRead() {
        CurrentRacePlayerService currentRacePlayerService =
                mock(CurrentRacePlayerService.class);
        RacePlayerRepository racePlayerRepository = mock(RacePlayerRepository.class);
        HttpServletRequest request = mock(HttpServletRequest.class);
        RacePlayerSessionIdentity identity = new RacePlayerSessionIdentity(3L, 17L);
        RacePlayer lockedRacePlayer = new RacePlayer();
        when(currentRacePlayerService.resolveCurrentRacePlayerIdentity(request))
                .thenReturn(identity);
        when(racePlayerRepository.findLockedByIdAndRaceId(17L, 3L))
                .thenReturn(Optional.of(lockedRacePlayer));
        RacePlayerSessionLockService service = new RacePlayerSessionLockService(
                currentRacePlayerService,
                racePlayerRepository
        );

        assertSame(lockedRacePlayer, service.resolveAndLock(request));

        InOrder order = inOrder(currentRacePlayerService, racePlayerRepository);
        order.verify(currentRacePlayerService)
                .resolveCurrentRacePlayerIdentity(request);
        order.verify(racePlayerRepository).findLockedByIdAndRaceId(17L, 3L);
        verify(currentRacePlayerService, never())
                .resolveCurrentRacePlayerSession(request);
    }
}
