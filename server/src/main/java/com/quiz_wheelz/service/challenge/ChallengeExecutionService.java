package com.quiz_wheelz.service.challenge;

import com.quiz_wheelz.common.ChallengeExecutionRules;
import com.quiz_wheelz.dto.raceengine.AnswerRaceImpact;
import com.quiz_wheelz.entitys.PlayerQuestion;
import com.quiz_wheelz.entitys.RacePlayer;
import com.quiz_wheelz.enums.*;
import com.quiz_wheelz.service.raceengine.RaceFinishService;
import com.quiz_wheelz.service.raceengine.RacePlayerSpeedEffectService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(propagation = Propagation.MANDATORY)
public class ChallengeExecutionService {
    private final ChallengeExecutionStateService states;
    private final RacePlayerSpeedEffectService effects;
    private final RaceFinishService finish;

    @Transactional(propagation = Propagation.MANDATORY, readOnly = true,
            noRollbackFor = com.quiz_wheelz.exception.ApiException.class)
    public void validate(RacePlayer player, PlayerQuestion question) {
        states.validateQuestion(player, question);
    }

    public AnswerRaceImpact resolve(RacePlayer player, PlayerQuestion question, boolean correct, long epochMs) {
        states.validateQuestion(player, question);
        var offer = question.getChallengeOffer();
        int score = 0;
        int progress = 0;
        offer.setQuestionsResolved(offer.getQuestionsResolved() + 1);
        if (correct) {
            offer.setCorrectAnswers(offer.getCorrectAnswers() + 1);
        }
        if (offer.getChoice() == ChallengeChoice.TURBO_TRIAL) {
            score = correct ? ChallengeExecutionRules.TURBO_SCORE : 0;
            progress = correct ? ChallengeExecutionRules.TURBO_PROGRESS : 0;
            offer.setOutcome(correct ? ChallengeOutcome.TURBO_SUCCESS : ChallengeOutcome.TURBO_FAILURE);
            offer.setExecutionEndedAtEpochMs(epochMs);
            if (!correct) {
                effects.createSlowdownForLockedPlayer(player, EffectSource.TURBO_FAILURE,
                        ChallengeExecutionRules.FAILURE_MAGNITUDE_TENTHS, epochMs,
                        Math.addExact(epochMs, ChallengeExecutionRules.FAILURE_DURATION_MS));
            }
        } else {
            score = correct ? ChallengeExecutionRules.SAFE_SCORE : 0;
            progress = correct ? ChallengeExecutionRules.SAFE_PROGRESS : 0;
            if (offer.getQuestionsResolved() == ChallengeExecutionRules.SAFE_QUESTIONS) {
                boolean perfect = offer.getCorrectAnswers() == ChallengeExecutionRules.SAFE_QUESTIONS;
                offer.setOutcome(perfect ? ChallengeOutcome.SAFE_PERFECT : ChallengeOutcome.SAFE_COMPLETE);
                offer.setExecutionEndedAtEpochMs(epochMs);
                if (perfect) {
                    score += ChallengeExecutionRules.SAFE_PERFECT_SCORE;
                    progress += ChallengeExecutionRules.SAFE_PERFECT_PROGRESS;
                }
            }
        }
        double before = player.getPosition();
        player.setScore(player.getScore() + score);
        player.setPosition(Math.min(before + progress, player.getRace().getTotalDistance()));
        if (finish.finishPlayerAt(player, epochMs)) {
            finish.finishRaceIfNeeded(player.getRace());
        }
        return new AnswerRaceImpact(player.getRace().getId(), player.getId(), correct, score,
                (double) progress, player.getScore(), player.getPosition(), player.getSpeed(),
                player.getStreak(), player.getHighestStreak(), player.getCorrectAnswers(), player.getWrongAnswers(),
                player.getCurrentDifficulty(), player.getCurrentDifficulty(), player.getDifficultyCorrectStreak(),
                player.getDifficultyWrongStreak(), false, player.getStatus(), player.getRace().getStatus(),
                player.getStatus() == RacePlayerStatus.FINISHED, player.getRace().getStatus() == RaceStatus.FINISHED);
    }
}
