package com.quiz_wheelz.dto.answer;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@AllArgsConstructor
public class SubmitAnswerResponse {

    private Long questionId;
    private Long selectedChoiceId;
    private boolean correct;
    private Long correctAnswerChoiceId;
    private String questionStatus;
    private LocalDateTime answeredAt;
    private LocalDateTime expiresAt;
}
