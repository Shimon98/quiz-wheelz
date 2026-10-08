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
@Check(constraints = "challenge_energy >= 0 and challenge_energy <= 100")
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
}
