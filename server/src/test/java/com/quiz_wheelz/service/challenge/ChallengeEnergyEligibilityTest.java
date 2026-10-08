package com.quiz_wheelz.service.challenge;

import com.quiz_wheelz.entitys.*;
import com.quiz_wheelz.enums.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.EnumSource;

import static org.junit.jupiter.api.Assertions.*;

class ChallengeEnergyEligibilityTest {
    private final ChallengeEnergyService energy = new ChallengeEnergyService();
    private final ChallengeEligibilityService eligibility = new ChallengeEligibilityService();

    @ParameterizedTest
    @CsvSource({"EASY,20", "MEDIUM,25", "HARD,30"})
    void earnsApprovedDifficultyWithoutStreakBonus(Difficulty difficulty, int expected) {
        var state = state(0, 10);
        state.getRacePlayer().setStreak(100);
        energy.earn(state, difficulty, QuestionGameplayContext.NORMAL, true);
        assertEquals(expected, state.getChallengeEnergy());
    }

    @ParameterizedTest
    @EnumSource(Difficulty.class)
    void wrongAnswerEarnsNothing(Difficulty difficulty) {
        var state = state(40, 10);
        energy.earn(state, difficulty, QuestionGameplayContext.NORMAL, false);
        assertEquals(40, state.getChallengeEnergy());
    }

    @ParameterizedTest
    @EnumSource(value = QuestionGameplayContext.class, names = {"TURBO_TRIAL", "SAFE_RUN"})
    void specialContextsEarnNothing(QuestionGameplayContext context) {
        var state = state(40, 10);
        energy.earn(state, Difficulty.HARD, context, true);
        assertEquals(40, state.getChallengeEnergy());
    }

    @ParameterizedTest
    @EnumSource(Difficulty.class)
    void clampsToMaximum(Difficulty difficulty) {
        var state = state(90, 10);
        energy.earn(state, difficulty, QuestionGameplayContext.NORMAL, true);
        assertEquals(100, state.getChallengeEnergy());
    }

    @ParameterizedTest
    @EnumSource(value = RacePlayerStatus.class, names = {"WAITING", "FINISHED", "DISCONNECTED"})
    void nonRacingCannotEarnOrOpen(RacePlayerStatus status) {
        var state = state(100, 10);
        state.getRacePlayer().setStatus(status);
        energy.earn(state, Difficulty.HARD, QuestionGameplayContext.NORMAL, true);
        assertEquals(100, state.getChallengeEnergy());
        assertFalse(eligibility.eligible(state, false));
    }

    @ParameterizedTest
    @EnumSource(value = RaceStatus.class, mode = EnumSource.Mode.EXCLUDE, names = "IN_PROGRESS")
    void nonProgressRaceCannotEarnOrOpen(RaceStatus status) {
        var state = state(90, 10);
        state.getRacePlayer().getRace().setStatus(status);
        energy.earn(state, Difficulty.HARD, QuestionGameplayContext.NORMAL, true);
        assertEquals(90, state.getChallengeEnergy());
        state.setChallengeEnergy(100);
        assertFalse(eligibility.eligible(state, false));
    }

    @ParameterizedTest
    @CsvSource({"799.99,true", "800,false", "800.01,false", "1000,false"})
    void strictEightyPercentGate(double position, boolean expected) {
        var state = state(100, position);
        assertEquals(expected, eligibility.eligible(state, false));
        assertEquals(100, state.getChallengeEnergy());
    }

    @Test
    void unresolvedChallengeAndInsufficientEnergyBlockOffer() {
        assertFalse(eligibility.eligible(state(100, 10), true));
        assertFalse(eligibility.eligible(state(99, 10), false));
    }

    @Test
    void invalidDistanceAndPositionCannotOpenOffer() {
        var state = state(100, 10);
        for (Integer distance : new Integer[]{null, 0, -1}) {
            state.getRacePlayer().getRace().setTotalDistance(distance);
            assertFalse(eligibility.eligible(state, false));
        }
        state.getRacePlayer().getRace().setTotalDistance(1000);
        state.getRacePlayer().setPosition(Double.NaN);
        assertFalse(eligibility.eligible(state, false));
    }

    private RacePlayerGameplayState state(int amount, double position) {
        var race = new Race();
        race.setStatus(RaceStatus.IN_PROGRESS);
        race.setTotalDistance(1000);
        var player = new RacePlayer();
        player.setRace(race);
        player.setStatus(RacePlayerStatus.RACING);
        player.setPosition(position);
        var state = new RacePlayerGameplayState();
        state.setRacePlayer(player);
        state.setChallengeEnergy(amount);
        return state;
    }
}
