package com.quiz_wheelz;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.security.servlet.UserDetailsServiceAutoConfiguration;
import org.springframework.scheduling.annotation.EnableScheduling;

// Teachers sign in through AuthService and the JWT cookie only. Without a UserDetailsService bean Spring Boot adds an
// in-memory "user" with a generated password (logged at startup); nothing uses it, so it is excluded.
@EnableScheduling
@SpringBootApplication(exclude = UserDetailsServiceAutoConfiguration.class)
public class QuizWheelzApplication {

    public static void main(String[] args) {
        SpringApplication.run(QuizWheelzApplication.class, args);
    }

}
