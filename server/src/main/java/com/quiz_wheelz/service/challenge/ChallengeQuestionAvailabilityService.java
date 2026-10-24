package com.quiz_wheelz.service.challenge;

import com.quiz_wheelz.entitys.RacePlayer;
import com.quiz_wheelz.enums.ChallengeChoice;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ChallengeQuestionAvailabilityService {
    private final ChallengeQuestionPlanService plans;

    public boolean available(RacePlayer player) {
        var subject = player.getRace().getSubject();
        return subject != null && plans.hasTemplates(subject, ChallengeChoice.TURBO_TRIAL)
                && plans.hasTemplates(subject, ChallengeChoice.SAFE_RUN);
    }
}
