package com.quiz_wheelz.entitys;

import com.quiz_wheelz.common.BaseEntity;
import com.quiz_wheelz.enums.ChallengeChoice;
import com.quiz_wheelz.enums.ChallengeOfferStatus;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.Check;

@Entity
@Table(name = "race_player_challenge_offers", indexes = {
        @Index(name = "idx_challenge_offer_player_status", columnList = "race_player_id,status")
})
@Check(constraints = "offered_at_epoch_ms < expires_at_epoch_ms and "
        + "((status = 'ACTIVE' and choice is null and resolved_at_epoch_ms is null) or "
        + "(status = 'SELECTED' and choice is not null and resolved_at_epoch_ms is not null) or "
        + "(status = 'EXPIRED' and choice is null and resolved_at_epoch_ms is not null "
        + "and resolved_at_epoch_ms = expires_at_epoch_ms) or "
        + "(status = 'CANCELLED' and choice is null and resolved_at_epoch_ms is not null))")
@Getter
@Setter
@NoArgsConstructor
public class RacePlayerChallengeOffer extends BaseEntity {
    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "race_player_id", nullable = false)
    private RacePlayer racePlayer;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private ChallengeOfferStatus status = ChallengeOfferStatus.ACTIVE;

    @Enumerated(EnumType.STRING)
    @Column(length = 30)
    private ChallengeChoice choice;

    @NotNull
    @Column(name = "offered_at_epoch_ms", nullable = false)
    private Long offeredAtEpochMs;

    @NotNull
    @Column(name = "expires_at_epoch_ms", nullable = false)
    private Long expiresAtEpochMs;

    @Column(name = "resolved_at_epoch_ms")
    private Long resolvedAtEpochMs;
}
