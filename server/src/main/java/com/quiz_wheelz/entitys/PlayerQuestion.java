package com.quiz_wheelz.entitys;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.quiz_wheelz.common.BaseEntity;
import com.quiz_wheelz.common.QuestionRules;
import com.quiz_wheelz.enums.PlayerQuestionStatus;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(
        name = "player_questions",
        indexes = {
                @Index(
                        name = "idx_player_questions_race_player_status",
                        columnList = "race_player_id,status"
                ),
                @Index(
                        name = "idx_player_questions_race_player_created",
                        columnList = "race_player_id,created_at"
                ),
                @Index(
                        name = "idx_player_questions_status_expires",
                        columnList = "status,expires_at"
                )
        }
)
@Getter
@Setter
@NoArgsConstructor
public class PlayerQuestion extends BaseEntity {

    @NotNull
    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "race_player_id", nullable = false)
    private RacePlayer racePlayer;

    @NotNull
    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "question_template_id", nullable = false)
    private QuestionTemplate questionTemplate;

    @NotBlank
    @Column(name = "question_text", nullable = false, columnDefinition = "TEXT")
    private String questionText;

    @NotNull
    @PositiveOrZero
    @JsonIgnore
    @Column(name = "correct_answer_value", nullable = false)
    private Integer correctAnswerValue;

    @NotNull
    @Min(QuestionRules.MIN_TIME_LIMIT_SECONDS)
    @Max(QuestionRules.MAX_TIME_LIMIT_SECONDS)
    @Column(name = "time_limit_seconds", nullable = false)
    private Integer timeLimitSeconds;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private PlayerQuestionStatus status = PlayerQuestionStatus.ACTIVE;

    @NotNull
    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    @Column(name = "answered_at")
    private LocalDateTime answeredAt;

    @JsonIgnore
    @OneToMany(
            mappedBy = "playerQuestion",
            cascade = CascadeType.ALL,
            orphanRemoval = true
    )
    @OrderBy("displayOrder ASC")
    private List<PlayerQuestionChoice> choices = new ArrayList<>();

    public void addChoice(PlayerQuestionChoice choice) {
        if (choice == null) {
            return;
        }

        choice.setPlayerQuestion(this);
        choices.add(choice);
    }
}
