package com.quiz_wheelz.config.seed;

import com.quiz_wheelz.enums.Difficulty;
import com.quiz_wheelz.enums.QuestionGenerationPattern;
import com.quiz_wheelz.enums.QuestionType;
import lombok.Value;

@Value(staticConstructor = "of")
public class MathQuestionTemplateSeed {

    QuestionType questionType;
    Difficulty difficulty;
    QuestionGenerationPattern generationPattern;
    int minValue;
    int maxValue;
    int timeLimitSeconds;
    int choicesCount;
}
