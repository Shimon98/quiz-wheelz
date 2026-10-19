package com.quiz_wheelz.service.raceplayer;

import com.quiz_wheelz.enums.*;
import com.quiz_wheelz.repository.RacePlayerLuckDecisionRepository;
import com.quiz_wheelz.service.luck.*;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@TestPropertySource(properties = "QUIZWHEELZ_LUCK_ANSWER_ENABLED=true")
@Import({FairLuckService.class, GuardShieldService.class, LuckTransactionGuard.class,
        LuckEffectResolver.class, LuckOwnStateReader.class, LuckPeerReader.class, LuckPeerJdbcResources.class, LuckDecisionSourceReader.class, RaceLuckFairnessStateService.class})
class B1LuckChallengeAnswerTest extends S4ExecutionIntegrationFixture {
    @MockitoBean LuckRandomSource random;
    @Autowired RacePlayerLuckDecisionRepository luck;

    @ParameterizedTest
    @EnumSource(ChallengeChoice.class)
    void specialAnswersNeverInitiateLuckOrShield(ChallengeChoice choice) {
        select(choice);
        int normalCorrect = second().getCorrectAnswers();
        answer(true);
        assertEquals(normalCorrect, second().getCorrectAnswers());
        transactions.executeWithoutResult(status -> {
            assertTrue(luck.findByRacePlayerIdOrderByDecisionSequenceAsc(secondId).isEmpty());
            assertFalse(stateRepository.findByRacePlayerId(secondId).orElseThrow().getGuardShieldGranted());
        });
        verifyNoInteractions(random);
    }
}
