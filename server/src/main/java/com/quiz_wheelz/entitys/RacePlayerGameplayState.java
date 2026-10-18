package com.quiz_wheelz.entitys;

import com.quiz_wheelz.common.BaseEntity;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Max;
import com.quiz_wheelz.common.ChallengeRules;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.Check;
import org.hibernate.annotations.ColumnDefault;

@Entity
@Table(name = "race_player_gameplay_states")
@Check(constraints = "challenge_energy between 0 and 100 and guard_shield_charges between 0 and 1 "
        + "and luck_events_received between 0 and 2 and luck_rolls_taken >= 0")
@Getter
@Setter
@NoArgsConstructor
public class RacePlayerGameplayState extends BaseEntity {

    @NotNull
    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "race_player_id", nullable = false, unique = true)
    private RacePlayer racePlayer;

    @NotNull
    @PositiveOrZero
    @Max(ChallengeRules.ENERGY_THRESHOLD)
    @ColumnDefault("0")
    @Column(name = "challenge_energy", nullable = false)
    private Integer challengeEnergy = 0;

    @NotNull
    @PositiveOrZero
    @Max(1)
    @ColumnDefault("0")
    @Column(name = "guard_shield_charges", nullable = false)
    private Integer guardShieldCharges = 0;

    @NotNull
    @ColumnDefault("false")
    @Column(name = "guard_shield_granted", nullable = false)
    private Boolean guardShieldGranted = false;

    @Column(name = "guard_shield_award_question_id")
    private Long guardShieldAwardQuestionId;

    @NotNull
    @PositiveOrZero
    @ColumnDefault("0")
    @Column(name = "luck_rolls_taken", nullable = false)
    private Integer luckRollsTaken = 0;

    @NotNull
    @PositiveOrZero
    @Max(2)
    @ColumnDefault("0")
    @Column(name = "luck_events_received", nullable = false)
    private Integer luckEventsReceived = 0;

    @Column(name = "next_luck_roll_not_before_epoch_ms")
    private Long nextLuckRollNotBeforeEpochMs;

    @Column(name = "last_luck_roll_sequence")
    private Long lastLuckRollSequence;

    @Column(name = "last_luck_received_sequence")
    private Long lastLuckReceivedSequence;

    @Column(name = "last_accepted_manual_normal_answer_at_epoch_ms")
    private Long lastAcceptedManualNormalAnswerAtEpochMs;

    @NotNull
    @ColumnDefault("false")
    @Column(name = "last_luck_was_negative", nullable = false)
    private Boolean lastLuckWasNegative = false;
}
