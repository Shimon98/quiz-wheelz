package com.quiz_wheelz.service.challenge;

import com.quiz_wheelz.common.ChallengeExecutionRules;
import com.quiz_wheelz.common.QuestionRules;
import com.quiz_wheelz.dto.question.QuestionPlan;
import com.quiz_wheelz.entitys.RacePlayerChallengeOffer;
import com.quiz_wheelz.enums.ChallengeChoice;
import com.quiz_wheelz.enums.Difficulty;
import com.quiz_wheelz.exception.ApiException;
import com.quiz_wheelz.exception.ErrorCode;
import com.quiz_wheelz.repository.QuestionTemplateRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ChallengeQuestionPlanService {
    private final QuestionTemplateRepository templates;

    public QuestionPlan build(RacePlayerChallengeOffer offer) {
        var difficulty = offer.getChoice() == ChallengeChoice.TURBO_TRIAL ? Difficulty.HARD : Difficulty.EASY;
        var subject = offer.getRacePlayer().getRace().getSubject();
        var available = templates.findBySubjectAndDifficultyAndActiveTrueOrderByIdAsc(subject, difficulty);
        if (available.isEmpty()) {
            throw new ApiException(ErrorCode.QUESTION_TEMPLATE_NOT_AVAILABLE_FOR_PLAYER);
        }
        var template = available.get(Math.floorMod(offer.getQuestionsResolved(), available.size()));
        return new QuestionPlan(subject, template.getType(), difficulty, template.getMinValue(),
                template.getMaxValue(), ChallengeExecutionRules.TIME_LIMIT_SECONDS, template.getChoicesCount(),
                template.getGenerationPattern(), QuestionRules.DEFAULT_ADAPTIVE_MODE,
                QuestionRules.DEFAULT_ASSISTANCE_LEVEL);
    }
}
