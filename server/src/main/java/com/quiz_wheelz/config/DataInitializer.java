package com.quiz_wheelz.config;

import com.quiz_wheelz.entitys.User;
import com.quiz_wheelz.enums.UserRole;

import com.quiz_wheelz.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        createTeacherIfMissing();
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
}