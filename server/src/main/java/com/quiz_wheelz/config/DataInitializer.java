package com.quiz_wheelz.config;

import com.quiz_wheelz.config.seed.MathQuestionTemplateSeed;
import com.quiz_wheelz.config.seed.MathQuestionTemplateSeedCatalog;
import com.quiz_wheelz.entitys.QuestionTemplate;
import com.quiz_wheelz.entitys.Subject;
import com.quiz_wheelz.entitys.User;
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
        MathQuestionTemplateSeedCatalog.defaultMathSeeds()
                .forEach(seed -> createTemplateIfMissing(mathSubject, seed));
    }

    private void createTemplateIfMissing(
            Subject subject,
            MathQuestionTemplateSeed seed
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
}
