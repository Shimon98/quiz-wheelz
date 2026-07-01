package com.quiz_wheelz.config;

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
        verify(questionTemplateRepository, times(20)).save(templateCaptor.capture());

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
                QuestionType.MULTIPLICATION,
                Difficulty.HARD,
                QuestionGenerationPattern.SMALL_MULTIPLICATION_CHAIN
        );

        verifyExistsChecked(
                mathSubject,
                QuestionType.ORDER_OF_OPERATIONS,
                Difficulty.HARD,
                QuestionGenerationPattern.ADD_MULTIPLY_SUBTRACT
        );
        verifyExistsChecked(
                mathSubject,
                QuestionType.MULTIPLICATION,
                Difficulty.HARD,
                QuestionGenerationPattern.SMALL_MULTIPLICATION_CHAIN
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
