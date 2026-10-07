package com.quiz_wheelz.dto.raceplayer;

import com.quiz_wheelz.enums.EffectSource;
import com.quiz_wheelz.enums.EffectType;

public record StudentRaceActiveEffectResponse(
        Long effectId,
        EffectType type,
        EffectSource source,
        Integer magnitudeTenths,
        Long startsAtEpochMs,
        Long endsAtEpochMs
) {
}
