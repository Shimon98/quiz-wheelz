package com.quiz_wheelz.entitys;

import com.quiz_wheelz.common.BaseEntity;
import com.quiz_wheelz.enums.EffectSource;
import com.quiz_wheelz.enums.EffectType;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.Check;

@Entity
@Table(name = "race_player_speed_effects", indexes = {
        @Index(name = "idx_speed_effect_player_window",
                columnList = "race_player_id,starts_at_epoch_ms,ends_at_epoch_ms")
})
@Check(constraints = "magnitude_tenths > 0 and starts_at_epoch_ms < ends_at_epoch_ms")
@Getter
@Setter
@NoArgsConstructor
public class RacePlayerSpeedEffect extends BaseEntity {

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "race_player_id", nullable = false)
    private RacePlayer racePlayer;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private EffectType type;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private EffectSource source;

    @NotNull
    @Positive
    @Column(name = "magnitude_tenths", nullable = false)
    private Integer magnitudeTenths;

    @NotNull
    @Column(name = "starts_at_epoch_ms", nullable = false)
    private Long startsAtEpochMs;

    @NotNull
    @Column(name = "ends_at_epoch_ms", nullable = false)
    private Long endsAtEpochMs;
}
