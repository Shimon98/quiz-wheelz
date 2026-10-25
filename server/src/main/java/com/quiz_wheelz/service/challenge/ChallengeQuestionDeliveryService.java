package com.quiz_wheelz.service.challenge;

import com.quiz_wheelz.common.ChallengeExecutionRules;
import com.quiz_wheelz.entitys.PlayerQuestion;
import com.quiz_wheelz.entitys.RacePlayer;
import com.quiz_wheelz.enums.QuestionGameplayContext;
import com.quiz_wheelz.service.question.PlayerQuestionPersistenceService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ChallengeQuestionDeliveryService {
    private static final Logger LOGGER = LoggerFactory.getLogger(ChallengeQuestionDeliveryService.class);

    private final ChallengeExecutionStateService states;
    private final ChallengeQuestionPlanService plans;
    private final PlayerQuestionPersistenceService persistence;
    private final ChallengeOfferService offers;

    public void validateCurrent(RacePlayer player, Optional<PlayerQuestion> active) {
        active.ifPresent(question -> states.validateQuestion(player, question));
    }

    public Optional<PlayerQuestion> resolve(RacePlayer player, Optional<PlayerQuestion> active, long decisionEpochMs) {
        validateCurrent(player, active);
        var running = states.running(player);
        if (running.isEmpty()) {
            return Optional.empty();
        }
        if (active.isPresent()) {
            return active;
        }
        var offer = running.get();
        var generated = plans.generateQuestion(offer);
        if (generated.isEmpty()) {
            // S4-03: a selected Turbo/Safe run used to stay SELECTED without a question once every template of its
            // choice became unusable after the offer was accepted; each question/current call failed again and the
            // student was stuck in the challenge. Such a run ends as a technical abort, never as a wrong answer or
            // a challenge result. Only the request that actually ends the open run, under the player lock, restores
            // the energy the offer reserved, so a retry or a concurrent request cannot refund twice; the same
            // request then continues with a NORMAL question. The question planning, generation and persistence
            // methods declare noRollbackFor = ApiException: a rejected template used to mark this transaction
            // rollback-only, which turned the answer into a 500 and silently undid the abort and the refund.
            offers.endUndeliverableRun(player, decisionEpochMs);
            LOGGER.warn("Challenge {} of race player {} ended without a result: no {} template produced a question",
                    offer.getId(), player.getId(), offer.getChoice());
            return Optional.empty();
        }
        return Optional.of(persistence.persistGeneratedQuestion(player, generated.get(),
                QuestionGameplayContext.valueOf(offer.getChoice().name()), offer,
                ChallengeExecutionRules.TIME_LIMIT_SECONDS));
    }
}
