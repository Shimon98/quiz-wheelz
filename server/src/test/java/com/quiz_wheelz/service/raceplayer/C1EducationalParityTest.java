package com.quiz_wheelz.service.raceplayer;

import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class C1EducationalParityTest extends C1RaceAcceptanceFixture {
    @ParameterizedTest
    @ValueSource(ints = {0, 100})
    void fullSpeedTailwindSubstitutionUsesActualAnswerAndUnavailableChallengeTemplates(int initialEnergy) {
        transactions.executeWithoutResult(status -> {
            var player = playerRepository.findById(secondId).orElseThrow();
            player.setSpeed(2.0);
            stateRepository.findByRacePlayerId(secondId).orElseThrow().setChallengeEnergy(initialEnergy);
            entityManager.createQuery("update QuestionTemplate t set t.active = false where t.subject.id = :subject and t.difficulty = :difficulty")
                    .setParameter("subject", player.getRace().getSubject().getId())
                    .setParameter("difficulty", com.quiz_wheelz.enums.Difficulty.HARD).executeUpdate();
        });
        when(random.nextDouble()).thenReturn(0.0);
        var snapshot = submit(true).getRaceImpact().getSnapshot();
        var decision = history().getFirst();
        assertEquals(com.quiz_wheelz.enums.LuckEventType.TAILWIND, decision.getSelectedType());
        assertEquals(initialEnergy == 100 ? com.quiz_wheelz.enums.LuckOutcome.NO_EFFECT
                : com.quiz_wheelz.enums.LuckOutcome.APPLIED, decision.getOutcome());
        assertEquals(initialEnergy == 100 ? 100 : 35, energy());
        assertEquals(T + 45000, gameplay().getNextLuckRollNotBeforeEpochMs());
        assertNull(snapshot.getGameplay().challenge().offer());
        assertTrue(snapshot.getGameplay().activeEffects().isEmpty());
        assertEquals(10, snapshot.getScore());
        verify(random, times(2)).nextDouble();
    }

    @ParameterizedTest
    @ValueSource(doubles = {0.0, .5, .99})
    void identicalAcceptedInputsKeepScoreCountersStreakAndDifficultyWithLuckOnOrOff(double selected) throws Exception {
        observe();
        var output = new LinkedHashMap<String, Object>();
        List<Object> baseline = null;
        for (boolean on : new boolean[]{false, true}) {
            enabled(on);
            clock.set(T);
            when(random.nextDouble()).thenReturn(0.0, selected);
            var ids = newRace(2, 1000);
            long id = ids.getFirst();
            var education = new ArrayList<Object>();
            boolean[] inputs = {false, true, false, false, true, false, true, false};
            trace.clear();
            for (int step = 0; step < inputs.length; step++) {
                clock.set(T + step * 100);
                var snapshot = accept(id, inputs[step], step, on);
                var player = transactions.execute(status -> playerRepository.findById(id).orElseThrow());
                education.add(List.of(snapshot.getScore(), player.getCorrectAnswers(), player.getWrongAnswers(),
                        player.getStreak(), player.getHighestStreak(), player.getCurrentDifficulty(),
                        player.getDifficultyCorrectStreak(), player.getDifficultyWrongStreak()));
            }
            if (!on) baseline = List.copyOf(education);
            else assertEquals(baseline, education);
            output.put(on ? "ON" : "OFF", Map.of("education", education, "answers", new ArrayList<>(trace)));
        }
        evidence("educational-parity-" + selected, output);
    }
}
