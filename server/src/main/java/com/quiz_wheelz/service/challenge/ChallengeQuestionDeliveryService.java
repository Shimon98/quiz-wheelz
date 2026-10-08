package com.quiz_wheelz.service.challenge;

import com.quiz_wheelz.common.ChallengeExecutionRules;
import com.quiz_wheelz.entitys.PlayerQuestion;
import com.quiz_wheelz.entitys.RacePlayer;
import com.quiz_wheelz.enums.QuestionGameplayContext;
import com.quiz_wheelz.service.question.PlayerQuestionPersistenceService;
import com.quiz_wheelz.service.question.QuestionGenerationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ChallengeQuestionDeliveryService {
    private final ChallengeExecutionStateService states;
    private final ChallengeQuestionPlanService plans;
    private final QuestionGenerationService generation;
    private final PlayerQuestionPersistenceService persistence;

    public void validateCurrent(RacePlayer player, Optional<PlayerQuestion> active) {
        active.ifPresent(question -> states.validateQuestion(player, question));
    }

    public Optional<PlayerQuestion> resolve(RacePlayer player, Optional<PlayerQuestion> active) {
        validateCurrent(player, active);
        var running = states.running(player);
        if (running.isEmpty()) {
            return Optional.empty();
        }
        if (active.isPresent()) {
            return active;
        }
        var offer = running.get();
        var generated = generation.generate(plans.build(offer));
        return Optional.of(persistence.persistGeneratedQuestion(player, generated,
                QuestionGameplayContext.valueOf(offer.getChoice().name()), offer,
                ChallengeExecutionRules.TIME_LIMIT_SECONDS));
    }
}
