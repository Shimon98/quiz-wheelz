package com.quiz_wheelz.service.raceengine;

import com.quiz_wheelz.entitys.RacePlayer;
import com.quiz_wheelz.entitys.RacePlayerSpeedEffect;
import com.quiz_wheelz.enums.EffectSource;
import com.quiz_wheelz.enums.EffectType;
import com.quiz_wheelz.exception.ApiException;
import com.quiz_wheelz.exception.ErrorCode;
import com.quiz_wheelz.repository.RacePlayerSpeedEffectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class RacePlayerSpeedEffectService {

    private final RacePlayerSpeedEffectRepository repository;

    @Transactional(propagation = Propagation.MANDATORY)
    public RacePlayerSpeedEffect createSlowdownForLockedPlayer(
            RacePlayer player, EffectSource source, int magnitudeTenths,
            long startsAtEpochMs, long endsAtEpochMs
    ) {
        if (player == null || player.getId() == null || source == null
                || magnitudeTenths <= 0 || startsAtEpochMs >= endsAtEpochMs) {
            throw new ApiException(ErrorCode.SPEED_EFFECT_INVALID);
        }
        if (!repository.findOverlapping(player.getId(), startsAtEpochMs, endsAtEpochMs).isEmpty()) {
            throw new ApiException(ErrorCode.SPEED_EFFECT_OVERLAP);
        }
        RacePlayerSpeedEffect effect = new RacePlayerSpeedEffect();
        effect.setRacePlayer(player);
        effect.setType(EffectType.SPEED_SLOW);
        effect.setSource(source);
        effect.setMagnitudeTenths(magnitudeTenths);
        effect.setStartsAtEpochMs(startsAtEpochMs);
        effect.setEndsAtEpochMs(endsAtEpochMs);
        return repository.save(effect);
    }

    @Transactional(propagation = Propagation.MANDATORY, readOnly = true)
    public List<RacePlayerSpeedEffect> findOverlapping(
            RacePlayer player, long fromEpochMs, long toEpochMs
    ) {
        if (toEpochMs <= fromEpochMs) {
            return List.of();
        }
        return repository.findOverlapping(player.getId(), fromEpochMs, toEpochMs);
    }
}
