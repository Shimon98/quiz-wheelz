package com.quiz_wheelz.dto.question;

import com.quiz_wheelz.common.QuestionRules;
import com.quiz_wheelz.entitys.Subject;
import com.quiz_wheelz.enums.AdaptiveMode;
import com.quiz_wheelz.enums.AssistanceLevel;
import com.quiz_wheelz.enums.Difficulty;
import com.quiz_wheelz.enums.QuestionType;
import lombok.Getter;

import java.util.Set;

@Getter
public class QuestionGenerationRequest {

    private final Subject subject;
    private final Difficulty currentDifficulty;
    private final Set<QuestionType> allowedQuestionTypes;
    private final AdaptiveMode adaptiveMode;
    private final AssistanceLevel assistanceLevel;

    public QuestionGenerationRequest(
            Subject subject,
            Difficulty currentDifficulty,
            Set<QuestionType> allowedQuestionTypes,
            AdaptiveMode adaptiveMode,
            AssistanceLevel assistanceLevel
    ) {
        this.subject = subject;
        this.currentDifficulty = currentDifficulty;
        this.allowedQuestionTypes = allowedQuestionTypes == null || allowedQuestionTypes.isEmpty()
                ? QuestionRules.SUPPORTED_MATH_QUESTION_TYPES
                : allowedQuestionTypes;
        this.adaptiveMode = adaptiveMode == null ? AdaptiveMode.BASIC : adaptiveMode;
        this.assistanceLevel = assistanceLevel == null ? AssistanceLevel.NONE : assistanceLevel;
    }
}
