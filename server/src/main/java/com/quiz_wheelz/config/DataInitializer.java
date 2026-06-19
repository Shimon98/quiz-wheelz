package com.quiz_wheelz.config;

import com.quiz_wheelz.entitys.Subject;
import com.quiz_wheelz.entitys.User;
import com.quiz_wheelz.enums.UserRole;

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
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(
            UserRepository userRepository,
            SubjectRepository subjectRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.userRepository = userRepository;
        this.subjectRepository = subjectRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        createTeacherIfMissing();
        createMathSubjectIfMissing();
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

    private void createMathSubjectIfMissing() {
        if (subjectRepository.existsByCode(DEFAULT_SUBJECT_CODE)) {
            return;
        }
        Subject subject = new Subject();
        subject.setName(DEFAULT_SUBJECT_NAME);
        subject.setCode(DEFAULT_SUBJECT_CODE);
        subject.setActive(true);
        subjectRepository.save(subject);
    }
}
