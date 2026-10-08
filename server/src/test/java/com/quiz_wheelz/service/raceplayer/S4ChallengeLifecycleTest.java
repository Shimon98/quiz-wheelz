package com.quiz_wheelz.service.raceplayer;

import com.quiz_wheelz.enums.*;
import com.quiz_wheelz.exception.ApiException;
import com.quiz_wheelz.exception.ErrorCode;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.EnumSource;

import static org.junit.jupiter.api.Assertions.*;

class S4ChallengeLifecycleTest extends S4ChallengeIntegrationFixture {
    @ParameterizedTest
    @CsvSource({"EASY,20", "MEDIUM,25", "HARD,30"})
    void answerPersistsApprovedEnergyAndSnapshot(Difficulty difficulty, int gain) {
        transactions.executeWithoutResult(status -> locked().setCurrentDifficulty(difficulty));
        var response = answerSecond();
        assertEquals(gain, energy());
        assertEquals(gain, response.getRaceImpact().getSnapshot().getGameplay().challenge().energy());
        assertNull(response.getRaceImpact().getSnapshot().getGameplay().challenge().offer());
    }

    @Test
    void wrongAnswerAndTimeoutDoNotEarn() {
        energy(40);
        transactions.executeWithoutResult(status -> entityManager.find(
                com.quiz_wheelz.entitys.PlayerQuestionChoice.class, choiceId).setCorrect(false));
        transactions.executeWithoutResult(status -> {
            var correct = new com.quiz_wheelz.entitys.PlayerQuestionChoice();
            correct.setPlayerQuestion(questionRepository.findById(questionId).orElseThrow());
            correct.setChoiceText("2");
            correct.setAnswerValue(2);
            correct.setCorrect(true);
            correct.setDisplayOrder(2);
            entityManager.persist(correct);
        });
        answerSecond();
        assertEquals(40, energy());
    }

    @Test
    void ordinaryQuestionTimeoutDoesNotEarnEnergy() {
        energy(40);
        questionExpiry(T);
        snapshot();
        assertEquals(40, energy());
        assertEquals(PlayerQuestionStatus.EXPIRED, question().getStatus());
        assertTrue(offerRepository.findByIdAndRacePlayerId(-1L, secondId).isEmpty());
    }

    @ParameterizedTest
    @EnumSource(value = QuestionGameplayContext.class, names = {"TURBO_TRIAL", "SAFE_RUN"})
    void persistedSpecialContextDoesNotEarn(QuestionGameplayContext context) {
        transactions.executeWithoutResult(status -> {
            var question = questionRepository.findById(questionId).orElseThrow();
            var offer = new com.quiz_wheelz.entitys.RacePlayerChallengeOffer();
            offer.setRacePlayer(locked());
            offer.setStatus(ChallengeOfferStatus.SELECTED);
            offer.setChoice(ChallengeChoice.valueOf(context.name()));
            offer.setOfferedAtEpochMs(T);
            offer.setExpiresAtEpochMs(T + 12_000);
            offer.setResolvedAtEpochMs(T);
            offerRepository.save(offer);
            question.setGameplayContext(context);
            question.setChallengeOffer(offer);
        });
        energy(80);
        answerSecond();
        assertEquals(80, energy());
    }

    @Test
    void thresholdConsumesEnergyAndCreatesOneDurableTwelveSecondOffer() {
        Long id = openOffer();
        var offer = offer(id);
        assertEquals(ChallengeOfferStatus.ACTIVE, offer.getStatus());
        assertEquals(T, offer.getOfferedAtEpochMs());
        assertEquals(T + 12_000, offer.getExpiresAtEpochMs());
        assertNull(offer.getChoice());
        assertNull(offer.getResolvedAtEpochMs());
        assertEquals(0, energy());
        assertEquals(PlayerQuestionStatus.ANSWERED, question().getStatus());
        assertEquals(RacePlayerGameplayMode.CHALLENGE_CHOICE, snapshot().getGameplay().mode());
    }

    @Test
    void duplicateAnswerCannotEarnOrCreateAgain() {
        Long id = openOffer();
        var error = assertThrows(ApiException.class, this::answerSecond);
        assertEquals(ErrorCode.QUESTION_NOT_ACTIVE, error.getErrorCode());
        assertEquals(0, energy());
        assertEquals(id, snapshot().getGameplay().challenge().offer().offerId());
        assertEquals(1L, transactions.<Long>execute(status -> entityManager.createQuery(
                "select count(o) from RacePlayerChallengeOffer o where o.racePlayer.id = :id", Long.class)
                .setParameter("id", secondId).getSingleResult()));
    }

    @ParameterizedTest
    @CsvSource({"789.999, true", "790,false", "791,false"})
    void offerGateUsesPostAnswerPosition(double before, boolean opens) {
        energy(90);
        secondPosition(before);
        var response = answerSecond();
        assertEquals(opens, response.getRaceImpact().getSnapshot().getGameplay().challenge().offer() != null);
        assertEquals(opens ? 0 : 100, energy());
    }

    @Test
    void answerFinishingPlayerCannotEarnOrOffer() {
        energy(90);
        secondPosition(995);
        var response = answerSecond();
        assertEquals(RacePlayerStatus.FINISHED, second().getStatus());
        assertEquals(90, energy());
        assertNull(response.getRaceImpact().getSnapshot().getGameplay().challenge().offer());
    }

    @Test
    void unresolvedOfferPreventsAnotherOffer() {
        Long id = openOffer();
        transactions.executeWithoutResult(status -> {
            energy(100);
            offers.afterAnswer(locked(), questionRepository.findById(questionId).orElseThrow(),
                    Difficulty.EASY, true, T + 1);
        });
        assertEquals(100, energy());
        assertEquals(id, snapshot().getGameplay().challenge().offer().offerId());
    }

    @Test
    void rollbackAnswerRemovesEnergyOfferQuestionAndEngineMutationTogether() {
        energy(80);
        transactions.executeWithoutResult(status -> {
            answerSecond();
            status.setRollbackOnly();
        });
        assertEquals(80, energy());
        assertEquals(PlayerQuestionStatus.ACTIVE, question().getStatus());
        assertEquals(100.0, second().getPosition());
        assertNull(snapshot().getGameplay().challenge().offer());
        assertTrue(eventTypes().isEmpty());
    }
}
