package com.quiz_wheelz.config;

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
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final String DEV_TEACHER_USERNAME = "GojoSatoru";
    private static final String DEV_TEACHER_PASSWORD = "123456";
    private static final String DEV_TEACHER_DISPLAY_NAME = "Gojo Satoru";

    private static final String DEFAULT_SUBJECT_CODE = "MATH";
    private static final String DEFAULT_SUBJECT_NAME = "Math";

    private static final int DEFAULT_MIN_VALUE = 1;
    private static final int DEFAULT_MAX_VALUE = 10;
    private static final int DEFAULT_TIME_LIMIT_SECONDS = 30;
    private static final int DEFAULT_CHOICES_COUNT = 4;

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
        createTemplateIfMissing(mathSubject, QuestionType.ADDITION, Difficulty.EASY);
        createTemplateIfMissing(mathSubject, QuestionType.SUBTRACTION, Difficulty.EASY);
        createTemplateIfMissing(mathSubject, QuestionType.MULTIPLICATION, Difficulty.EASY);
        createTemplateIfMissing(mathSubject, QuestionType.DIVISION, Difficulty.EASY);
    }

    private void createTemplateIfMissing(
            Subject subject,
            QuestionType questionType,
            Difficulty difficulty
    ) {
        boolean exists = questionTemplateRepository.existsBySubjectAndTypeAndDifficultyAndGenerationPattern(
                subject,
                questionType,
                difficulty,
                QuestionGenerationPattern.BINARY_OPERATION
        );

        if (exists) {
            return;
        }

        QuestionTemplate template = new QuestionTemplate();
        template.setSubject(subject);
        template.setType(questionType);
        template.setDifficulty(difficulty);
        template.setGenerationPattern(QuestionGenerationPattern.BINARY_OPERATION);
        template.setMinValue(DEFAULT_MIN_VALUE);
        template.setMaxValue(DEFAULT_MAX_VALUE);
        template.setTimeLimitSeconds(DEFAULT_TIME_LIMIT_SECONDS);
        template.setChoicesCount(DEFAULT_CHOICES_COUNT);
        template.setActive(true);

        questionTemplateRepository.save(template);
    }
}
