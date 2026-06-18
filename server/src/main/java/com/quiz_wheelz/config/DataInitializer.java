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
        String username = "GojoSatoru";
        if (userRepository.existsByUsername(username)) {
            return;
        }
        User teacher = new User();
        teacher.setUsername(username);
        teacher.setPasswordHash(passwordEncoder.encode("123456"));
        teacher.setDisplayName("Gojo Satoru");
        teacher.setRole(UserRole.TEACHER);
        teacher.setActive(true);
        userRepository.save(teacher);
    }

    private void createMathSubjectIfMissing() {
        String code = "MATH";
        if (subjectRepository.existsByCode(code)) {
            return;
        }
        Subject subject = new Subject();
        subject.setName("Math");
        subject.setCode(code);
        subject.setActive(true);
        subjectRepository.save(subject);
    }
}
