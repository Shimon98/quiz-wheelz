package com.quiz_wheelz.dto.question;

import com.quiz_wheelz.common.QuestionRules;
import com.quiz_wheelz.entitys.Subject;
import com.quiz_wheelz.enums.AdaptiveMode;
import com.quiz_wheelz.enums.AssistanceLevel;
import com.quiz_wheelz.enums.Difficulty;
import com.quiz_wheelz.enums.QuestionType;
import lombok.Getter;

@Getter
public class QuestionPlan {

    private final Subject subject;
    private final QuestionType questionType;
    private final Difficulty difficulty;
    private final Integer minValue;
    private final Integer maxValue;
    private final Integer timeLimitSeconds;
    private final Integer choicesCount;
    private final AdaptiveMode adaptiveMode;
    private final AssistanceLevel assistanceLevel;

    public QuestionPlan(
            Subject subject,
            QuestionType questionType,
            Difficulty difficulty,
            Integer minValue,
            Integer maxValue,
            Integer timeLimitSeconds,
            Integer choicesCount,
            AdaptiveMode adaptiveMode,
            AssistanceLevel assistanceLevel
    ) {
        this.subject = subject;
        this.questionType = questionType;
        this.difficulty = difficulty;
        this.minValue = minValue;
        this.maxValue = maxValue;
        this.timeLimitSeconds = timeLimitSeconds == null
                ? QuestionRules.DEFAULT_TIME_LIMIT_SECONDS
                : timeLimitSeconds;
        this.choicesCount = choicesCount == null
                ? QuestionRules.DEFAULT_CHOICES_COUNT
                : choicesCount;
        this.adaptiveMode = adaptiveMode == null ? AdaptiveMode.BASIC : adaptiveMode;
        this.assistanceLevel = assistanceLevel == null ? AssistanceLevel.NONE : assistanceLevel;
    }
}
