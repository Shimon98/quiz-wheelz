package com.quiz_wheelz.entitys;

import com.quiz_wheelz.common.BaseEntity;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.Check;
import org.hibernate.annotations.ColumnDefault;

@Entity
@Table(name = "race_player_recovery_states")
@Check(constraints = "recent_outcome_bits between 0 and 63 and recent_outcome_count between 0 and 6 "
        + "and awarded_energy in (0, 10)")
@Getter
@Setter
@NoArgsConstructor
public class RacePlayerRecoveryState extends BaseEntity {

    @NotNull
    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "race_player_id", nullable = false, unique = true)
    private RacePlayer racePlayer;

    @NotNull
    @ColumnDefault("0")
    @Column(name = "recent_outcome_bits", nullable = false)
    private Integer recentOutcomeBits = 0;

    @NotNull
    @ColumnDefault("0")
    @Column(name = "recent_outcome_count", nullable = false)
    private Integer recentOutcomeCount = 0;

    @Column(name = "last_observed_normal_question_id")
    private Long lastObservedNormalQuestionId;

    @Column(name = "awarded_question_id")
    private Long awardedQuestionId;

    @NotNull
    @ColumnDefault("0")
    @Column(name = "awarded_energy", nullable = false)
    private Integer awardedEnergy = 0;

    @Column(name = "awarded_at_epoch_ms")
    private Long awardedAtEpochMs;
}
