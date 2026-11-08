package com.quiz_wheelz.service.recovery;

import java.math.BigDecimal;

public record RecoveryStanding(BigDecimal totalDistance, BigDecimal self, BigDecimal leader, BigDecimal median,
                               int racingPlayers) {
}
