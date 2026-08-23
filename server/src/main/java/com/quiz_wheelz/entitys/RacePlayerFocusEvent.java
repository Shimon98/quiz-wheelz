package com.quiz_wheelz.entitys;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.quiz_wheelz.common.BaseEntity;
import com.quiz_wheelz.enums.RacePlayerFocusEventOutcome;
import com.quiz_wheelz.enums.RacePlayerFocusEventType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "race_player_focus_events",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_focus_events_player_client_event",
                columnNames = {"race_player_id", "client_event_id"}
        ),
        indexes = @Index(
                name = "idx_focus_events_player_question_counted",
                columnList = "race_player_id,player_question_id,counted_focus_loss"
        )
)
@Getter
@Setter
@NoArgsConstructor
public class RacePlayerFocusEvent extends BaseEntity {

    @NotNull
    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "race_player_id", nullable = false)
    private RacePlayer racePlayer;

    @NotBlank
    @Column(name = "client_event_id", nullable = false, length = 36)
    private String clientEventId;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private RacePlayerFocusEventType type;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "player_question_id")
    private PlayerQuestion playerQuestion;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private RacePlayerFocusEventOutcome outcome;

    @NotNull
    @Column(name = "counted_focus_loss", nullable = false)
    private Boolean countedFocusLoss;

    @NotNull
    @PositiveOrZero
    @Column(name = "focus_loss_count_after", nullable = false)
    private Integer focusLossCountAfter;

    @NotNull
    @PositiveOrZero
    @Column(name = "question_focus_loss_count_after", nullable = false)
    private Integer questionFocusLossCountAfter;

    @NotNull
    @Column(name = "recorded_at", nullable = false)
    private LocalDateTime recordedAt;
}
