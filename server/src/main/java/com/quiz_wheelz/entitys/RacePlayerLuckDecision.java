package com.quiz_wheelz.entitys;

import com.quiz_wheelz.common.BaseEntity;
import com.quiz_wheelz.enums.LuckEventType;
import com.quiz_wheelz.enums.LuckOutcome;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.Check;

@Entity
@Table(name = "race_player_luck_decisions", uniqueConstraints = {
        @UniqueConstraint(name = "uk_luck_player_question", columnNames = {"race_player_id", "source_question_id"})
}, indexes = {
        @Index(name = "idx_luck_player_sequence", columnList = "race_player_id,decision_sequence"),
        @Index(name = "idx_luck_player_event", columnList = "race_player_id,id DESC")
})
@Check(constraints = "decision_sequence > 0 and "
        + "((outcome = 'NO_EVENT' and selected_type is null and applied_type is null) or "
        + "(outcome = 'NO_EFFECT' and selected_type is not null and applied_type is null) or "
        + "(outcome = 'APPLIED' and selected_type is not null and applied_type is not null) or "
        + "(outcome = 'BLOCKED_BY_SHIELD' and selected_type is not null and applied_type is not null "
        + "and selected_type = 'MUD_SPLASH' and applied_type = 'MUD_SPLASH'))")
@Getter
@Setter
@NoArgsConstructor
public class RacePlayerLuckDecision extends BaseEntity {
    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "race_player_id", nullable = false)
    private RacePlayer racePlayer;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "source_question_id", nullable = false)
    private PlayerQuestion sourceQuestion;

    @NotNull
    @Positive
    @Column(name = "decision_sequence", nullable = false)
    private Long decisionSequence;

    @NotNull
    @Column(name = "decided_at_epoch_ms", nullable = false)
    private Long decidedAtEpochMs;

    @Enumerated(EnumType.STRING)
    @Column(name = "selected_type", length = 30)
    private LuckEventType selectedType;

    @Enumerated(EnumType.STRING)
    @Column(name = "applied_type", length = 30)
    private LuckEventType appliedType;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private LuckOutcome outcome;

    @Column(name = "effective_magnitude_or_energy_delta")
    private Double effectiveMagnitudeOrEnergyDelta;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "speed_effect_id")
    private RacePlayerSpeedEffect speedEffect;
}
