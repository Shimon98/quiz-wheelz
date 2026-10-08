package com.quiz_wheelz.service.challenge;

import com.quiz_wheelz.entitys.RacePlayer;
import com.quiz_wheelz.enums.Difficulty;
import com.quiz_wheelz.repository.QuestionTemplateRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ChallengeQuestionAvailabilityService {
    private final QuestionTemplateRepository templates;

    public boolean available(RacePlayer player) {
        var subject = player.getRace().getSubject();
        return subject != null && templates.existsBySubjectAndDifficultyAndActiveTrue(subject, Difficulty.EASY)
                && templates.existsBySubjectAndDifficultyAndActiveTrue(subject, Difficulty.HARD);
    }
}
