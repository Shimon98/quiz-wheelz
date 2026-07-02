package com.quiz_wheelz.config;

import com.quiz_wheelz.common.QuestionTemplateSeedRules;
import com.quiz_wheelz.entitys.QuestionTemplate;
import com.quiz_wheelz.entitys.Subject;
import com.quiz_wheelz.enums.Difficulty;
import com.quiz_wheelz.enums.QuestionGenerationPattern;
import com.quiz_wheelz.enums.QuestionType;
import com.quiz_wheelz.repository.QuestionTemplateRepository;
import com.quiz_wheelz.repository.SubjectRepository;
import com.quiz_wheelz.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DataInitializerTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private SubjectRepository subjectRepository;

    @Mock
    private QuestionTemplateRepository questionTemplateRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Test
    void shouldSeedEasyMediumAndHardMathQuestionTemplatesWhenMissing() {
        Subject mathSubject = createMathSubject();
        DataInitializer dataInitializer = new DataInitializer(
                userRepository,
                subjectRepository,
                questionTemplateRepository,
                passwordEncoder
        );

        when(userRepository.existsByUsername("GojoSatoru")).thenReturn(true);
        when(subjectRepository.findByCode("MATH")).thenReturn(Optional.of(mathSubject));

        dataInitializer.run();

        ArgumentCaptor<QuestionTemplate> templateCaptor =
                ArgumentCaptor.forClass(QuestionTemplate.class);
        verify(questionTemplateRepository, times(31)).save(templateCaptor.capture());

        List<QuestionTemplate> savedTemplates = templateCaptor.getAllValues();

        assertContainsTemplate(
                savedTemplates,
                QuestionType.ADDITION,
                Difficulty.EASY,
                QuestionGenerationPattern.BINARY_OPERATION
        );
        assertContainsTemplate(
                savedTemplates,
                QuestionType.MULTIPLICATION,
                Difficulty.MEDIUM,
                QuestionGenerationPattern.BINARY_OPERATION
        );
        assertContainsTemplate(
                savedTemplates,
                QuestionType.ADDITION,
                Difficulty.MEDIUM,
                QuestionGenerationPattern.ADDITION_CHAIN,
                QuestionTemplateSeedRules.MEDIUM_ADDITIVE_MIN_VALUE,
                QuestionTemplateSeedRules.MEDIUM_ADDITIVE_MAX_VALUE,
                QuestionTemplateSeedRules.MEDIUM_ADDITIVE_CHAIN_TIME_LIMIT_SECONDS
        );
        assertContainsTemplate(
                savedTemplates,
                QuestionType.SUBTRACTION,
                Difficulty.MEDIUM,
                QuestionGenerationPattern.SUBTRACTION_CHAIN,
                QuestionTemplateSeedRules.MEDIUM_SUBTRACTION_CHAIN_MIN_VALUE,
                QuestionTemplateSeedRules.MEDIUM_SUBTRACTION_CHAIN_MAX_VALUE,
                QuestionTemplateSeedRules.MEDIUM_OPERATOR_CHAIN_TIME_LIMIT_SECONDS
        );
        assertContainsTemplate(
                savedTemplates,
                QuestionType.SUBTRACTION,
                Difficulty.MEDIUM,
                QuestionGenerationPattern.ADD_SUBTRACT_CHAIN,
                QuestionTemplateSeedRules.MEDIUM_ADDITIVE_MIN_VALUE,
                QuestionTemplateSeedRules.MEDIUM_ADDITIVE_MAX_VALUE,
                QuestionTemplateSeedRules.MEDIUM_ADDITIVE_CHAIN_TIME_LIMIT_SECONDS
        );
        assertContainsTemplate(
                savedTemplates,
                QuestionType.MULTIPLICATION,
                Difficulty.MEDIUM,
                QuestionGenerationPattern.SMALL_MULTIPLICATION_CHAIN,
                QuestionTemplateSeedRules.MEDIUM_MULTIPLICATION_CHAIN_MIN_VALUE,
                QuestionTemplateSeedRules.MEDIUM_MULTIPLICATION_CHAIN_MAX_VALUE,
                QuestionTemplateSeedRules.MEDIUM_OPERATOR_CHAIN_TIME_LIMIT_SECONDS
        );
        assertContainsTemplate(
                savedTemplates,
                QuestionType.ORDER_OF_OPERATIONS,
                Difficulty.MEDIUM,
                QuestionGenerationPattern.ADD_THEN_MULTIPLY
        );
        assertContainsTemplate(
                savedTemplates,
                QuestionType.PARENTHESES,
                Difficulty.MEDIUM,
                QuestionGenerationPattern.PARENTHESES_SUM_THEN_MULTIPLY
        );
        assertContainsTemplate(
                savedTemplates,
                QuestionType.PARENTHESES,
                Difficulty.MEDIUM,
                QuestionGenerationPattern.MULTIPLY_BY_PARENTHESES_SUM
        );
        assertContainsTemplate(
                savedTemplates,
                QuestionType.ORDER_OF_OPERATIONS,
                Difficulty.HARD,
                QuestionGenerationPattern.ADD_MULTIPLY_SUBTRACT
        );
        assertContainsTemplate(
                savedTemplates,
                QuestionType.ADDITION,
                Difficulty.HARD,
                QuestionGenerationPattern.ADDITION_CHAIN,
                QuestionTemplateSeedRules.HARD_ADDITIVE_MIN_VALUE,
                QuestionTemplateSeedRules.HARD_ADDITIVE_MAX_VALUE,
                QuestionTemplateSeedRules.HARD_ADDITIVE_CHAIN_TIME_LIMIT_SECONDS
        );
        assertContainsTemplate(
                savedTemplates,
                QuestionType.ADDITION,
                Difficulty.HARD,
                QuestionGenerationPattern.LONG_ADDITION_CHAIN,
                QuestionTemplateSeedRules.HARD_ADDITIVE_MIN_VALUE,
                QuestionTemplateSeedRules.HARD_ADDITIVE_MAX_VALUE,
                QuestionTemplateSeedRules.HARD_ADDITIVE_CHAIN_TIME_LIMIT_SECONDS
        );
        assertContainsTemplate(
                savedTemplates,
                QuestionType.SUBTRACTION,
                Difficulty.HARD,
                QuestionGenerationPattern.SUBTRACTION_CHAIN,
                QuestionTemplateSeedRules.HARD_SUBTRACTION_CHAIN_MIN_VALUE,
                QuestionTemplateSeedRules.HARD_SUBTRACTION_CHAIN_MAX_VALUE,
                QuestionTemplateSeedRules.HARD_OPERATOR_CHAIN_TIME_LIMIT_SECONDS
        );
        assertContainsTemplate(
                savedTemplates,
                QuestionType.SUBTRACTION,
                Difficulty.HARD,
                QuestionGenerationPattern.LONG_SUBTRACTION_CHAIN,
                QuestionTemplateSeedRules.HARD_SUBTRACTION_CHAIN_MIN_VALUE,
                QuestionTemplateSeedRules.HARD_SUBTRACTION_CHAIN_MAX_VALUE,
                QuestionTemplateSeedRules.HARD_OPERATOR_CHAIN_TIME_LIMIT_SECONDS
        );
        assertContainsTemplate(
                savedTemplates,
                QuestionType.SUBTRACTION,
                Difficulty.HARD,
                QuestionGenerationPattern.ADD_SUBTRACT_CHAIN,
                QuestionTemplateSeedRules.HARD_ADDITIVE_MIN_VALUE,
                QuestionTemplateSeedRules.HARD_ADDITIVE_MAX_VALUE,
                QuestionTemplateSeedRules.HARD_ADDITIVE_CHAIN_TIME_LIMIT_SECONDS
        );
        assertContainsTemplate(
                savedTemplates,
                QuestionType.SUBTRACTION,
                Difficulty.HARD,
                QuestionGenerationPattern.LONG_ADD_SUBTRACT_CHAIN,
                QuestionTemplateSeedRules.HARD_ADDITIVE_MIN_VALUE,
                QuestionTemplateSeedRules.HARD_ADDITIVE_MAX_VALUE,
                QuestionTemplateSeedRules.HARD_ADDITIVE_CHAIN_TIME_LIMIT_SECONDS
        );
        assertContainsTemplate(
                savedTemplates,
                QuestionType.MULTIPLICATION,
                Difficulty.HARD,
                QuestionGenerationPattern.SMALL_MULTIPLICATION_CHAIN,
                QuestionTemplateSeedRules.HARD_MULTIPLICATION_CHAIN_MIN_VALUE,
                QuestionTemplateSeedRules.HARD_MULTIPLICATION_CHAIN_MAX_VALUE,
                QuestionTemplateSeedRules.HARD_OPERATOR_CHAIN_TIME_LIMIT_SECONDS
        );
        assertContainsTemplate(
                savedTemplates,
                QuestionType.DIVISION,
                Difficulty.HARD,
                QuestionGenerationPattern.DIVISION_CHAIN,
                QuestionTemplateSeedRules.HARD_DIVISION_CHAIN_MIN_VALUE,
                QuestionTemplateSeedRules.HARD_DIVISION_CHAIN_MAX_VALUE,
                QuestionTemplateSeedRules.HARD_OPERATOR_CHAIN_TIME_LIMIT_SECONDS
        );

        verifyExistsChecked(
                mathSubject,
                QuestionType.ORDER_OF_OPERATIONS,
                Difficulty.HARD,
                QuestionGenerationPattern.ADD_MULTIPLY_SUBTRACT
        );
        verifyExistsChecked(
                mathSubject,
                QuestionType.ADDITION,
                Difficulty.HARD,
                QuestionGenerationPattern.LONG_ADDITION_CHAIN
        );
        verifyExistsChecked(
                mathSubject,
                QuestionType.SUBTRACTION,
                Difficulty.HARD,
                QuestionGenerationPattern.LONG_SUBTRACTION_CHAIN
        );
        verifyExistsChecked(
                mathSubject,
                QuestionType.SUBTRACTION,
                Difficulty.HARD,
                QuestionGenerationPattern.LONG_ADD_SUBTRACT_CHAIN
        );
        verifyExistsChecked(
                mathSubject,
                QuestionType.MULTIPLICATION,
                Difficulty.HARD,
                QuestionGenerationPattern.SMALL_MULTIPLICATION_CHAIN
        );
        verifyExistsChecked(
                mathSubject,
                QuestionType.DIVISION,
                Difficulty.HARD,
                QuestionGenerationPattern.DIVISION_CHAIN
        );
    }

    private void assertContainsTemplate(
            List<QuestionTemplate> templates,
            QuestionType questionType,
            Difficulty difficulty,
            QuestionGenerationPattern generationPattern,
            int minValue,
            int maxValue,
            int timeLimitSeconds
    ) {
        assertTrue(
                templates.stream().anyMatch(template ->
                        template.getType() == questionType
                                && template.getDifficulty() == difficulty
                                && template.getGenerationPattern() == generationPattern
                                && template.getMinValue() == minValue
                                && template.getMaxValue() == maxValue
                                && template.getTimeLimitSeconds() == timeLimitSeconds
                                && template.isActive()
                )
        );
    }

    private void assertContainsTemplate(
            List<QuestionTemplate> templates,
            QuestionType questionType,
            Difficulty difficulty,
            QuestionGenerationPattern generationPattern
    ) {
        assertTrue(
                templates.stream().anyMatch(template ->
                        template.getType() == questionType
                                && template.getDifficulty() == difficulty
                                && template.getGenerationPattern() == generationPattern
                                && template.isActive()
                )
        );
    }

    private void verifyExistsChecked(
            Subject subject,
            QuestionType questionType,
            Difficulty difficulty,
            QuestionGenerationPattern generationPattern
    ) {
        verify(questionTemplateRepository)
                .existsBySubjectAndTypeAndDifficultyAndGenerationPattern(
                        subject,
                        questionType,
                        difficulty,
                        generationPattern
                );
    }

    private Subject createMathSubject() {
        Subject subject = new Subject();
        subject.setCode("MATH");
        subject.setName("Math");
        subject.setActive(true);
        return subject;
    }
}
