package com.quiz_wheelz.service.raceplayer;

import com.quiz_wheelz.entitys.RacePlayerSpeedEffect;
import com.quiz_wheelz.enums.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.EnumSource;
import org.junit.jupiter.params.provider.ValueSource;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class S4ChallengeSlowdownEligibilityTest extends S4ExecutionIntegrationFixture {
    @ParameterizedTest
    @EnumSource(EffectSource.class)
    void activeSlowdownOfEverySourceSuppressesOfferAndPreservesEffect(EffectSource source) {
        energy(80);
        var effectId = slowdown(source, T, T + 4000);
        var before = effectState(effectId);
        var response = answerSecond();
        assertEquals(100, energy());
        assertEquals(100, response.getRaceImpact().getSnapshot().getGameplay().challenge().energy());
        assertNull(response.getRaceImpact().getSnapshot().getGameplay().challenge().offer());
        assertEquals(0, offerCount());
        assertEquals(before, effectState(effectId));
        assertEquals(1, effectCount());
    }

    @Test
    void fullEnergyStillCannotOfferDuringSlowdown() {
        energy(100);
        slowdown(EffectSource.CHALLENGE_TIMEOUT, T - 1, T + 4000);
        answerSecond();
        assertEquals(100, energy());
        assertEquals(0, offerCount());
    }

    @ParameterizedTest
    @CsvSource({"1,4001", "-4001,-1", "-4000,0"})
    void futureExpiredAndExactEndEffectsDoNotBlock(long startOffset, long endOffset) {
        energy(80);
        var effectId = slowdown(EffectSource.TURBO_FAILURE, T + startOffset, T + endOffset);
        var before = effectState(effectId);
        var response = answerSecond();
        assertNotNull(response.getRaceImpact().getSnapshot().getGameplay().challenge().offer());
        assertEquals(0, energy());
        assertEquals(1, offerCount());
        assertEquals(before, effectState(effectId));
        assertEquals(1, effectCount());
    }

    @Test
    void expiryRefreshAndReconnectDoNotOfferButNextNormalCorrectAnswerDoes() {
        energy(80);
        var effectId = slowdown(EffectSource.TURBO_FAILURE, T, T + 4000);
        var before = effectState(effectId);
        answerSecond();
        clock.set(T + 4000);
        assertNull(snapshot().getGameplay().challenge().offer());
        reconnect.reconnect(secondRequest);
        assertNull(snapshot().getGameplay().challenge().offer());
        assertEquals(100, energy());
        assertEquals(0, offerCount());
        normalGeneration();
        var response = answer(true);
        var offer = response.getRaceImpact().getSnapshot().getGameplay().challenge().offer();
        assertNotNull(offer);
        assertEquals(0, energy());
        assertEquals(1, offerCount());
        assertEquals(T + 4000, offer(offer.offerId()).getOfferedAtEpochMs());
        assertEquals(T + 16000, offer.expiresAtEpochMs());
        assertEquals(List.of(ChallengeChoice.TURBO_TRIAL, ChallengeChoice.SAFE_RUN), offer.choices());
        assertEquals(before, effectState(effectId));
        assertEquals(1, effectCount());
        snapshot();
        assertEquals(1, offerCount());
    }

    @ParameterizedTest
    @ValueSource(booleans = {false, true})
    void progressGateStillPreventsOfferAfterSlowdownEnds(boolean active) {
        energy(80);
        slowdown(EffectSource.CHALLENGE_TIMEOUT, T - 4000, active ? T + 1 : T);
        secondPosition(790);
        assertNull(answerSecond().getRaceImpact().getSnapshot().getGameplay().challenge().offer());
        assertEquals(100, energy());
        assertEquals(0, offerCount());
    }

    @ParameterizedTest
    @EnumSource(value = Difficulty.class, names = {"EASY", "HARD"})
    void missingTemplateStillPreventsOfferAfterSlowdownEnds(Difficulty missing) {
        energy(80);
        slowdown(EffectSource.TURBO_FAILURE, T - 4000, T);
        transactions.executeWithoutResult(status -> templates.findBySubjectAndDifficultyAndActiveTrueOrderByIdAsc(
                locked().getRace().getSubject(), missing).forEach(template -> template.setActive(false)));
        assertNull(answerSecond().getRaceImpact().getSnapshot().getGameplay().challenge().offer());
        assertEquals(100, energy());
        assertEquals(0, offerCount());
    }

    @ParameterizedTest
    @ValueSource(booleans = {false, true})
    void unresolvedOfferStillPreventsAnotherOffer(boolean active) {
        var id = openOffer();
        energy(100);
        slowdown(EffectSource.CHALLENGE_TIMEOUT, T - 4000, active ? T + 1 : T);
        transactions.executeWithoutResult(status -> offers.afterAnswer(locked(),
                questionRepository.findById(questionId).orElseThrow(), Difficulty.EASY, true, T));
        assertEquals(100, energy());
        assertEquals(1, offerCount());
        assertEquals(id, snapshot().getGameplay().challenge().offer().offerId());
    }

    private Long slowdown(EffectSource source, long start, long end) {
        return transactions.execute(status -> {
            var effect = new RacePlayerSpeedEffect();
            effect.setRacePlayer(locked());
            effect.setType(EffectType.SPEED_SLOW);
            effect.setSource(source);
            effect.setMagnitudeTenths(2);
            effect.setStartsAtEpochMs(start);
            effect.setEndsAtEpochMs(end);
            return effectRepository.saveAndFlush(effect).getId();
        });
    }

    private List<Object> effectState(Long id) {
        return transactions.execute(status -> {
            var effect = effectRepository.findById(id).orElseThrow();
            return List.of(effect.getId(), effect.getRacePlayer().getId(), effect.getType(), effect.getSource(),
                    effect.getMagnitudeTenths(), effect.getStartsAtEpochMs(), effect.getEndsAtEpochMs());
        });
    }

    private long offerCount() {
        return transactions.execute(status -> entityManager.createQuery(
                "select count(o) from RacePlayerChallengeOffer o where o.racePlayer.id = :id", Long.class)
                .setParameter("id", secondId).getSingleResult());
    }

    private long effectCount() {
        return transactions.execute(status -> entityManager.createQuery(
                "select count(e) from RacePlayerSpeedEffect e where e.racePlayer.id = :id", Long.class)
                .setParameter("id", secondId).getSingleResult());
    }
}
