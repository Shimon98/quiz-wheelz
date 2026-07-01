package com.quiz_wheelz.config;

import com.quiz_wheelz.common.QuestionTemplateSeedRules;
import com.quiz_wheelz.entitys.QuestionTemplate;
import com.quiz_wheelz.entitys.Subject;
import com.quiz_wheelz.entitys.User;
import com.quiz_wheelz.enums.Difficulty;
import com.quiz_wheelz.enums.QuestionGenerationPattern;
import com.quiz_wheelz.enums.QuestionType;
import com.quiz_wheelz.enums.UserRole;
import com.quiz_wheelz.repository.QuestionTemplateRepository;
import com.quiz_wheelz.repository.SubjectRepository;
import com.quiz_wheelz.repository.UserRepository;
import lombok.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final String DEV_TEACHER_USERNAME = "GojoSatoru";
    private static final String DEV_TEACHER_PASSWORD = "123456";
    private static final String DEV_TEACHER_DISPLAY_NAME = "Gojo Satoru";

    private static final String DEFAULT_SUBJECT_CODE = "MATH";
    private static final String DEFAULT_SUBJECT_NAME = "Math";

    private final UserRepository userRepository;
    private final SubjectRepository subjectRepository;
    private final QuestionTemplateRepository questionTemplateRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(
            UserRepository userRepository,
            SubjectRepository subjectRepository,
            QuestionTemplateRepository questionTemplateRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.userRepository = userRepository;
        this.subjectRepository = subjectRepository;
        this.questionTemplateRepository = questionTemplateRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        createTeacherIfMissing();
        Subject mathSubject = getOrCreateMathSubject();
        createDefaultMathQuestionTemplatesIfMissing(mathSubject);
    }

    private void createTeacherIfMissing() {
        if (userRepository.existsByUsername(DEV_TEACHER_USERNAME)) {
            return;
        }
        User teacher = new User();
        teacher.setUsername(DEV_TEACHER_USERNAME);
        teacher.setPasswordHash(passwordEncoder.encode(DEV_TEACHER_PASSWORD));
        teacher.setDisplayName(DEV_TEACHER_DISPLAY_NAME);
        teacher.setRole(UserRole.TEACHER);
        teacher.setActive(true);
        userRepository.save(teacher);
    }

    private Subject getOrCreateMathSubject() {
        return subjectRepository.findByCode(DEFAULT_SUBJECT_CODE)
                .orElseGet(() -> {
                    Subject subject = new Subject();
                    subject.setName(DEFAULT_SUBJECT_NAME);
                    subject.setCode(DEFAULT_SUBJECT_CODE);
                    subject.setActive(true);
                    return subjectRepository.save(subject);
                });
    }

    private void createDefaultMathQuestionTemplatesIfMissing(Subject mathSubject) {
        mathTemplateSeeds().forEach(seed -> createTemplateIfMissing(mathSubject, seed));
    }

    private void createTemplateIfMissing(
            Subject subject,
            MathTemplateSeed seed
    ) {
        boolean exists = questionTemplateRepository.existsBySubjectAndTypeAndDifficultyAndGenerationPattern(
                subject,
                seed.getQuestionType(),
                seed.getDifficulty(),
                seed.getGenerationPattern()
        );

        if (exists) {
            return;
        }

        QuestionTemplate template = new QuestionTemplate();
        template.setSubject(subject);
        template.setType(seed.getQuestionType());
        template.setDifficulty(seed.getDifficulty());
        template.setGenerationPattern(seed.getGenerationPattern());
        template.setMinValue(seed.getMinValue());
        template.setMaxValue(seed.getMaxValue());
        template.setTimeLimitSeconds(seed.getTimeLimitSeconds());
        template.setChoicesCount(seed.getChoicesCount());
        template.setActive(true);

        questionTemplateRepository.save(template);
    }

    private List<MathTemplateSeed> mathTemplateSeeds() {
        return List.of(
                seed(QuestionType.ADDITION, Difficulty.EASY, QuestionGenerationPattern.BINARY_OPERATION),
                seed(QuestionType.SUBTRACTION, Difficulty.EASY, QuestionGenerationPattern.BINARY_OPERATION),
                seed(QuestionType.MULTIPLICATION, Difficulty.EASY, QuestionGenerationPattern.BINARY_OPERATION),
                seed(QuestionType.DIVISION, Difficulty.EASY, QuestionGenerationPattern.BINARY_OPERATION),

                seed(QuestionType.ADDITION, Difficulty.MEDIUM, QuestionGenerationPattern.BINARY_OPERATION),
                seed(QuestionType.SUBTRACTION, Difficulty.MEDIUM, QuestionGenerationPattern.BINARY_OPERATION),
                seed(QuestionType.MULTIPLICATION, Difficulty.MEDIUM, QuestionGenerationPattern.BINARY_OPERATION),
                seed(QuestionType.DIVISION, Difficulty.MEDIUM, QuestionGenerationPattern.BINARY_OPERATION),
                seed(QuestionType.ORDER_OF_OPERATIONS, Difficulty.MEDIUM, QuestionGenerationPattern.ADD_THEN_MULTIPLY),
                seed(QuestionType.PARENTHESES, Difficulty.MEDIUM, QuestionGenerationPattern.PARENTHESES_SUM_THEN_MULTIPLY),
                seed(QuestionType.PARENTHESES, Difficulty.MEDIUM, QuestionGenerationPattern.MULTIPLY_BY_PARENTHESES_SUM),

                seed(QuestionType.ADDITION, Difficulty.HARD, QuestionGenerationPattern.BINARY_OPERATION),
                seed(QuestionType.SUBTRACTION, Difficulty.HARD, QuestionGenerationPattern.BINARY_OPERATION),
                seed(QuestionType.MULTIPLICATION, Difficulty.HARD, QuestionGenerationPattern.BINARY_OPERATION),
                seed(QuestionType.DIVISION, Difficulty.HARD, QuestionGenerationPattern.BINARY_OPERATION),
                seed(QuestionType.ORDER_OF_OPERATIONS, Difficulty.HARD, QuestionGenerationPattern.ADD_THEN_MULTIPLY),
                seed(QuestionType.ORDER_OF_OPERATIONS, Difficulty.HARD, QuestionGenerationPattern.ADD_MULTIPLY_SUBTRACT),
                seed(QuestionType.PARENTHESES, Difficulty.HARD, QuestionGenerationPattern.PARENTHESES_SUM_THEN_MULTIPLY),
                seed(QuestionType.PARENTHESES, Difficulty.HARD, QuestionGenerationPattern.MULTIPLY_BY_PARENTHESES_SUM),
                seed(QuestionType.MULTIPLICATION, Difficulty.HARD, QuestionGenerationPattern.SMALL_MULTIPLICATION_CHAIN)
        );
    }

    private MathTemplateSeed seed(
            QuestionType questionType,
            Difficulty difficulty,
            QuestionGenerationPattern generationPattern
    ) {
        return MathTemplateSeed.of(
                questionType,
                difficulty,
                generationPattern,
                minValueForDifficulty(difficulty),
                maxValueForDifficulty(difficulty),
                timeLimitSecondsForDifficulty(difficulty),
                QuestionTemplateSeedRules.DEFAULT_CHOICES_COUNT
        );
    }

    private int minValueForDifficulty(Difficulty difficulty) {
        return switch (difficulty) {
            case EASY -> QuestionTemplateSeedRules.EASY_MIN_VALUE;
            case MEDIUM -> QuestionTemplateSeedRules.MEDIUM_MIN_VALUE;
            case HARD -> QuestionTemplateSeedRules.HARD_MIN_VALUE;
        };
    }

    private int maxValueForDifficulty(Difficulty difficulty) {
        return switch (difficulty) {
            case EASY -> QuestionTemplateSeedRules.EASY_MAX_VALUE;
            case MEDIUM -> QuestionTemplateSeedRules.MEDIUM_MAX_VALUE;
            case HARD -> QuestionTemplateSeedRules.HARD_MAX_VALUE;
        };
    }

    private int timeLimitSecondsForDifficulty(Difficulty difficulty) {
        return switch (difficulty) {
            case EASY -> QuestionTemplateSeedRules.EASY_TIME_LIMIT_SECONDS;
            case MEDIUM -> QuestionTemplateSeedRules.MEDIUM_TIME_LIMIT_SECONDS;
            case HARD -> QuestionTemplateSeedRules.HARD_TIME_LIMIT_SECONDS;
        };
    }

    @Value(staticConstructor = "of")
    private static class MathTemplateSeed {

        QuestionType questionType;
        Difficulty difficulty;
        QuestionGenerationPattern generationPattern;
        int minValue;
        int maxValue;
        int timeLimitSeconds;
        int choicesCount;
    }
}
