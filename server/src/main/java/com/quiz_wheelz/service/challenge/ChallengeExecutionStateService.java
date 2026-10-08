package com.quiz_wheelz.service.challenge;

import com.quiz_wheelz.common.ChallengeExecutionRules;
import com.quiz_wheelz.entitys.*;
import com.quiz_wheelz.enums.*;
import com.quiz_wheelz.exception.ApiException;
import com.quiz_wheelz.exception.ErrorCode;
import com.quiz_wheelz.repository.PlayerQuestionRepository;
import com.quiz_wheelz.repository.RacePlayerChallengeOfferRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Clock;
import com.quiz_wheelz.utils.DateTimeUtils;
import java.util.Objects;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ChallengeExecutionStateService {
    private final RacePlayerChallengeOfferRepository offers;
    private final PlayerQuestionRepository questions;
    private final Clock clock;

    public Optional<RacePlayerChallengeOffer> running(RacePlayer player) {
        var current = offers.findFirstByRacePlayerIdAndStatusAndExecutionEndedAtEpochMsIsNullOrderByIdDesc(
                player.getId(), ChallengeOfferStatus.SELECTED);
        current.ifPresent(this::validateRunning);
        return current;
    }

    public int total(RacePlayerChallengeOffer offer) {
        return offer.getChoice() == ChallengeChoice.TURBO_TRIAL
                ? ChallengeExecutionRules.TURBO_QUESTIONS : ChallengeExecutionRules.SAFE_QUESTIONS;
    }

    private void validateRunning(RacePlayerChallengeOffer offer) {
        if (offer.getChoice() == null || offer.getQuestionsResolved() == null || offer.getCorrectAnswers() == null
                || offer.getQuestionsResolved() < 0 || offer.getQuestionsResolved() >= total(offer)
                || offer.getCorrectAnswers() < 0 || offer.getCorrectAnswers() > offer.getQuestionsResolved()
                || offer.getOutcome() != null) {
            throw invalid();
        }
    }

    public void validateQuestion(RacePlayer player, PlayerQuestion question) {
        var run = running(player);
        if (question.getGameplayContext() == QuestionGameplayContext.NORMAL) {
            if (question.getChallengeOffer() != null || run.isPresent()) {
                throw invalid();
            }
            return;
        }
        var linked = question.getChallengeOffer();
        if (run.isEmpty() || linked == null || !Objects.equals(linked.getId(), run.get().getId())
                || !Objects.equals(linked.getRacePlayer().getId(), player.getId())
                || !Objects.equals(question.getRacePlayer().getId(), player.getId())
                || question.getGameplayContext() != QuestionGameplayContext.valueOf(run.get().getChoice().name())) {
            throw invalid();
        }
    }

    public void abort(RacePlayer player, long epochMs) {
        offers.findFirstByRacePlayerIdAndStatusAndExecutionEndedAtEpochMsIsNullOrderByIdDesc(
                player.getId(), ChallengeOfferStatus.SELECTED).ifPresent(offer -> {
            long terminalEpoch = player.getFinishedAtEpochMs() != null ? player.getFinishedAtEpochMs()
                    : player.getRace().getFinishedAt() != null
                        ? DateTimeUtils.toEpochMilli(player.getRace().getFinishedAt(), clock.getZone()) : epochMs;
            offer.setExecutionEndedAtEpochMs(terminalEpoch);
            questions.findFirstByRacePlayerAndStatusOrderByCreatedAtDesc(player, PlayerQuestionStatus.ACTIVE)
                    .filter(question -> question.getGameplayContext() != QuestionGameplayContext.NORMAL)
                    .ifPresent(question -> question.setStatus(PlayerQuestionStatus.EXPIRED));
        });
    }

    private ApiException invalid() {
        return new ApiException(ErrorCode.CHALLENGE_EXECUTION_STATE_INVALID);
    }
}
