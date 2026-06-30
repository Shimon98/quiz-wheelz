package com.quiz_wheelz;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@EnableScheduling
@SpringBootApplication
public class QuizWheelzApplication {

    public static void main(String[] args) {
        SpringApplication.run(QuizWheelzApplication.class, args);
    }

}
