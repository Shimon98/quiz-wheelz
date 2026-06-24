package com.quiz_wheelz.entitys;

import com.quiz_wheelz.common.BaseEntity;
import com.quiz_wheelz.enums.Difficulty;
import com.quiz_wheelz.enums.QuestionGenerationPattern;
import com.quiz_wheelz.enums.QuestionType;
import jakarta.persistence.*;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "question_templates")
@Getter
@Setter
@NoArgsConstructor
public class QuestionTemplate extends BaseEntity {

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "subject_id", nullable = false)
    private Subject subject;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private QuestionType type;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Difficulty difficulty;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "generation_pattern", nullable = false, length = 60)
    private QuestionGenerationPattern generationPattern = QuestionGenerationPattern.BINARY_OPERATION;

    @NotNull
    @Min(0)
    @Column(name = "min_value", nullable = false)
    private Integer minValue;

    @NotNull
    @Min(1)
    @Column(name = "max_value", nullable = false)
    private Integer maxValue;

    @NotNull
    @Min(5)
    @Max(300)
    @Column(name = "time_limit_seconds", nullable = false)
    private Integer timeLimitSeconds;

    @NotNull
    @Min(2)
    @Max(6)
    @Column(name = "choices_count", nullable = false)
    private Integer choicesCount;

    @Column(nullable = false)
    private boolean active = true;
}
