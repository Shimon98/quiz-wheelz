package com.quiz_wheelz.service.raceplayer;

import com.quiz_wheelz.dto.raceplayer.StudentRaceActiveEffectResponse;
import com.quiz_wheelz.dto.raceplayer.StudentRacePowerUpsResponse;
import com.quiz_wheelz.dto.raceplayer.StudentRaceLuckResponse;
import com.quiz_wheelz.repository.RacePlayerGameplayStateRepository;
import com.quiz_wheelz.repository.RacePlayerLuckDecisionRepository;
import com.quiz_wheelz.enums.LuckOutcome;
import com.quiz_wheelz.common.LuckRules;
import org.springframework.data.domain.PageRequest;
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
    private final RacePlayerGameplayStateRepository states;
    private final RacePlayerLuckDecisionRepository decisions;

    public StudentRaceGameplayResponse resolve(
            RacePlayer player, RaceStatus raceStatus, RacePlayerStatus playerStatus,
            Double baseSpeed, long snapshotAtEpochMs
    ) {
        boolean moving = raceStatus == RaceStatus.IN_PROGRESS && playerStatus == RacePlayerStatus.RACING;
        var challenge = challengeProjection.resolve(player, moving, snapshotAtEpochMs);
        var powerUps = states.findByRacePlayerId(player.getId())
                .map(state -> new StudentRacePowerUpsResponse(state.getGuardShieldCharges(), state.getGuardShieldAwardQuestionId()))
                .orElseGet(() -> new StudentRacePowerUpsResponse(0, null));
        var luck = new StudentRaceLuckResponse(decisions.findByRacePlayerIdAndOutcomeInOrderByIdAsc(player.getId(),
                        List.of(LuckOutcome.APPLIED, LuckOutcome.BLOCKED_BY_SHIELD), PageRequest.of(0, LuckRules.MAX_EVENTS))
                .stream().map(event -> new StudentRaceLuckResponse.Event(event.getId(), event.getSelectedType(),
                        event.getAppliedType(), event.getOutcome(), event.getDecidedAtEpochMs())).toList());
        if (!moving) {
            return new StudentRaceGameplayResponse(RacePlayerGameplayMode.NORMAL, 0.0, List.of(),
                    challenge.challenge(), powerUps, luck);
        }
        var active = calculator.activeSpeedEffects(
                effectService.findActiveAt(player, snapshotAtEpochMs), snapshotAtEpochMs
        );
        return new StudentRaceGameplayResponse(
                challenge.mode(),
                calculator.effectiveSpeedAt(baseSpeed == null ? 0.0 : baseSpeed, snapshotAtEpochMs, active),
                active.stream().map(effect -> new StudentRaceActiveEffectResponse(
                        effect.getId(), effect.getType(), effect.getSource(), effect.getMagnitudeTenths(),
                        effect.getStartsAtEpochMs(), effect.getEndsAtEpochMs()
                )).toList(),
                challenge.challenge(), powerUps, luck
        );
    }
}
