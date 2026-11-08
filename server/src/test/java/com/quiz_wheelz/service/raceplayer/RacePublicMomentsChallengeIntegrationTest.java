package com.quiz_wheelz.service.raceplayer;

import com.quiz_wheelz.dto.liveevent.RacePublicMoment;
import com.quiz_wheelz.enums.ChallengeChoice;
import com.quiz_wheelz.enums.RacePublicMomentKind;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

// S4-06: a won challenge is public on the very answer that won it; a lost Turbo or an imperfect Safe run never is.
class RacePublicMomentsChallengeIntegrationTest extends S4ExecutionIntegrationFixture {

    @Test
    void aWonTurboIsAPublicMomentOfItsOffer() {
        select(ChallengeChoice.TURBO_TRIAL);

        answer(true);

        assertEquals(List.of(new RacePublicMoment(RacePublicMomentKind.TURBO_SUCCESS, executionId)),
                answeredMoments().getLast());
    }

    @Test
    void aLostTurboIsNeverPublic() {
        select(ChallengeChoice.TURBO_TRIAL);

        answer(false);

        assertEquals(List.of(), answeredMoments().getLast());
    }

    @Test
    void aPerfectSafeRunIsPublicOnlyOnItsThirdAnswer() {
        select(ChallengeChoice.SAFE_RUN);

        answer(true);
        answer(true);
        answer(true);

        List<List<RacePublicMoment>> moments = answeredMoments();
        assertEquals(List.of(List.of(), List.of(),
                List.of(new RacePublicMoment(RacePublicMomentKind.SAFE_PERFECT, executionId))),
                moments.subList(moments.size() - 3, moments.size()));
    }

    @Test
    void anImperfectSafeRunIsNeverPublic() {
        select(ChallengeChoice.SAFE_RUN);

        answer(true);
        answer(false);
        answer(true);

        List<List<RacePublicMoment>> moments = answeredMoments();
        assertEquals(List.of(List.of(), List.of(), List.of()), moments.subList(moments.size() - 3, moments.size()));
    }
}
