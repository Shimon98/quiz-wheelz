package com.quiz_wheelz.dto.subject;

import com.quiz_wheelz.entitys.Subject;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class SubjectResponse {

    private Long id;
    private String name;
    private String code;

    public static SubjectResponse from(Subject subject) {
        return new SubjectResponse(
                subject.getId(),
                subject.getName(),
                subject.getCode()
        );
    }
}
