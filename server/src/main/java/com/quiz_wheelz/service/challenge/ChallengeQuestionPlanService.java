package com.quiz_wheelz.service.challenge;

import com.quiz_wheelz.common.ChallengeExecutionRules;
import com.quiz_wheelz.entitys.QuestionTemplate;
import com.quiz_wheelz.entitys.RacePlayerChallengeOffer;
import com.quiz_wheelz.entitys.Subject;
import com.quiz_wheelz.enums.ChallengeChoice;
import com.quiz_wheelz.enums.Difficulty;
import com.quiz_wheelz.enums.QuestionGenerationPattern;
import com.quiz_wheelz.exception.ApiException;
import com.quiz_wheelz.exception.ErrorCode;
import com.quiz_wheelz.repository.QuestionTemplateRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ChallengeQuestionPlanService {
    private final QuestionTemplateRepository templates;

    public QuestionTemplate selectTemplate(RacePlayerChallengeOffer offer) {
        var candidates = candidates(offer.getRacePlayer().getRace().getSubject(), offer.getChoice());
        if (candidates.isEmpty()) {
            throw new ApiException(ErrorCode.QUESTION_TEMPLATE_NOT_AVAILABLE_FOR_PLAYER);
        }
        return candidates.get(Math.floorMod(offer.getId() + offer.getQuestionsResolved(), candidates.size()));
    }

    public boolean hasTemplates(Subject subject, ChallengeChoice choice) {
        return !candidates(subject, choice).isEmpty();
    }

    private List<QuestionTemplate> candidates(Subject subject, ChallengeChoice choice) {
        var difficulty = choice == ChallengeChoice.TURBO_TRIAL ? Difficulty.HARD : Difficulty.EASY;
        return templates.findBySubjectAndDifficultyAndActiveTrueOrderByIdAsc(subject, difficulty).stream()
                .filter(template -> approved(template, choice))
                .toList();
    }

    private boolean approved(QuestionTemplate template, ChallengeChoice choice) {
        if (choice == ChallengeChoice.TURBO_TRIAL) {
            return ChallengeExecutionRules.TURBO_GENERATION_PATTERNS.contains(template.getGenerationPattern());
        }
        return template.getGenerationPattern() == QuestionGenerationPattern.BINARY_OPERATION
                && ChallengeExecutionRules.SAFE_QUESTION_TYPES.contains(template.getType());
    }
}
