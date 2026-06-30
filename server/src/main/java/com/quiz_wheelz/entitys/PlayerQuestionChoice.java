package com.quiz_wheelz.entitys;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.quiz_wheelz.common.BaseEntity;
import com.quiz_wheelz.common.QuestionRules;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(
        name = "player_question_choices",
        indexes = {
                @Index(
                        name = "idx_player_question_choices_question_order",
                        columnList = "player_question_id,display_order"
                )
        }
)
@Getter
@Setter
@NoArgsConstructor
public class PlayerQuestionChoice extends BaseEntity {

    @NotNull
    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "player_question_id", nullable = false)
    private PlayerQuestion playerQuestion;

    @NotBlank
    @Column(name = "choice_text", nullable = false, length = 80)
    private String choiceText;

    @NotNull
    @PositiveOrZero
    @JsonIgnore
    @Column(name = "answer_value", nullable = false)
    private Integer answerValue;

    @JsonIgnore
    @Column(nullable = false)
    private boolean correct;

    @NotNull
    @Min(QuestionRules.FIRST_DISPLAY_ORDER)
    @Column(name = "display_order", nullable = false)
    private Integer displayOrder;
}
