package com.quiz_wheelz.dto.answer;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SubmitAnswerRequest {

    @NotNull
    private Long questionId;

    @NotNull
    private Long choiceId;
}
