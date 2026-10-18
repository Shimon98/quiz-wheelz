package com.quiz_wheelz.entitys;

import com.quiz_wheelz.common.BaseEntity;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.Check;
import org.hibernate.annotations.ColumnDefault;

@Entity
@Table(name = "race_luck_fairness_states")
@Check(constraints = "decision_sequence >= 0")
@Getter
@Setter
@NoArgsConstructor
public class RaceLuckFairnessState extends BaseEntity {
    @NotNull
    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "race_id", nullable = false, unique = true)
    private Race race;

    @NotNull
    @PositiveOrZero
    @ColumnDefault("0")
    @Column(name = "decision_sequence", nullable = false)
    private Long decisionSequence = 0L;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "last_event_recipient_player_id")
    private RacePlayer lastEventRecipient;

    @Column(name = "last_event_sequence")
    private Long lastEventSequence;
}
