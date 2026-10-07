package com.quiz_wheelz.service.raceplayer;

import com.quiz_wheelz.dto.raceplayer.StudentRaceActiveEffectResponse;
import com.quiz_wheelz.dto.raceplayer.StudentRaceGameplayResponse;
import com.quiz_wheelz.entitys.RacePlayer;
import com.quiz_wheelz.enums.RacePlayerGameplayMode;
import com.quiz_wheelz.enums.RacePlayerStatus;
import com.quiz_wheelz.enums.RaceStatus;
import com.quiz_wheelz.service.raceengine.RacePlayerSpeedEffectService;
import com.quiz_wheelz.service.raceengine.RaceSpeedEffectMovementCalculator;
import com.quiz_wheelz.service.challenge.StudentChallengeProjectionService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class StudentRaceGameplayProjectionService {

    private final RacePlayerSpeedEffectService effectService;
    private final RaceSpeedEffectMovementCalculator calculator;
    private final StudentChallengeProjectionService challengeProjection;

    public StudentRaceGameplayResponse resolve(
            RacePlayer player, RaceStatus raceStatus, RacePlayerStatus playerStatus,
            Double baseSpeed, long snapshotAtEpochMs
    ) {
        boolean moving = raceStatus == RaceStatus.IN_PROGRESS && playerStatus == RacePlayerStatus.RACING;
        var challenge = challengeProjection.resolve(player, moving, snapshotAtEpochMs);
        if (!moving) {
            return new StudentRaceGameplayResponse(RacePlayerGameplayMode.NORMAL, 0.0, List.of(),
                    challenge.challenge());
        }
        var active = calculator.activeSlowdowns(
                effectService.findActiveAt(player, snapshotAtEpochMs), snapshotAtEpochMs
        );
        return new StudentRaceGameplayResponse(
                challenge.mode(),
                calculator.effectiveSpeedAt(baseSpeed == null ? 0.0 : baseSpeed, snapshotAtEpochMs, active),
                active.stream().map(effect -> new StudentRaceActiveEffectResponse(
                        effect.getId(), effect.getType(), effect.getSource(), effect.getMagnitudeTenths(),
                        effect.getStartsAtEpochMs(), effect.getEndsAtEpochMs()
                )).toList(),
                challenge.challenge()
        );
    }
}
