package com.quiz_wheelz.service.raceplayer;

import com.quiz_wheelz.repository.RacePlayerRecoveryStateRepository;
import com.quiz_wheelz.service.recovery.HiddenRecoveryService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Import;

import static org.junit.jupiter.api.Assertions.*;

@Import(HiddenRecoveryService.class)
class HiddenRecoveryOffIntegrationTest extends S4ChallengeFlowFixture {
    @Autowired RacePlayerRecoveryStateRepository recoveryStates;

    @Test
    void withTheFlagOffTheSameQualifyingRaceWritesNoRecoveryRowAndGivesNoEnergy() {
        secondPosition(300.0);
        transactions.executeWithoutResult(status -> {
            var race = raceRepository.findById(raceId).orElseThrow();
            entityManager.persist(player(race, "Leader", 3, 480.0));
            entityManager.persist(player(race, "Middle", 4, 400.0));
        });
        answerSecond();
        answer(false);
        answer(false);
        answer(true);
        answer(false);
        current();
        transactions.executeWithoutResult(status -> questionRepository
                .findFirstByRacePlayerAndStatusOrderByCreatedAtDesc(locked(),
                        com.quiz_wheelz.enums.PlayerQuestionStatus.ACTIVE)
                .orElseThrow().setExpiresAt(local(T)));
        snapshot();

        answer(true);

        assertEquals(60, energy());
        assertTrue(transactions.<Boolean>execute(status -> recoveryStates.findByRacePlayerId(secondId).isEmpty()));
    }
}
