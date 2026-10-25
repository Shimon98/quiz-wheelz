package com.quiz_wheelz.service.challenge;

import com.quiz_wheelz.common.ChallengeExecutionRules;
import com.quiz_wheelz.dto.question.internal.InternalGeneratedQuestion;
import com.quiz_wheelz.entitys.QuestionTemplate;
import com.quiz_wheelz.entitys.RacePlayerChallengeOffer;
import com.quiz_wheelz.entitys.Subject;
import com.quiz_wheelz.enums.ChallengeChoice;
import com.quiz_wheelz.enums.Difficulty;
import com.quiz_wheelz.enums.QuestionGenerationPattern;
import com.quiz_wheelz.repository.QuestionTemplateRepository;
import com.quiz_wheelz.service.question.QuestionTemplateFallbackService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ChallengeQuestionPlanService {
    private final QuestionTemplateRepository templates;
    private final QuestionTemplateFallbackService fallback;

    public Optional<InternalGeneratedQuestion> generateQuestion(RacePlayerChallengeOffer offer) {
        return fallback.generateFromFirstUsable(selectTemplates(offer));
    }

    public boolean hasTemplates(Subject subject, ChallengeChoice choice) {
        return fallback.generateFromFirstUsable(candidates(subject, choice)).isPresent();
    }

    List<QuestionTemplate> selectTemplates(RacePlayerChallengeOffer offer) {
        var candidates = new ArrayList<>(candidates(offer.getRacePlayer().getRace().getSubject(), offer.getChoice()));
        if (!candidates.isEmpty()) {
            Collections.rotate(candidates,
                    -Math.floorMod(offer.getId() + offer.getQuestionsResolved(), candidates.size()));
        }
        return candidates;
    }

    private List<QuestionTemplate> candidates(Subject subject, ChallengeChoice choice) {
        var difficulty = choice == ChallengeChoice.TURBO_TRIAL ? Difficulty.HARD : Difficulty.EASY;
        return templates.findBySubjectAndDifficultyAndActiveTrueOrderByIdAsc(subject, difficulty).stream()
                .filter(fallback::hasValidConfig)
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
