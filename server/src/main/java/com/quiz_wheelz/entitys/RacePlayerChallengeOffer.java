package com.quiz_wheelz.entitys;

import com.quiz_wheelz.common.BaseEntity;
import com.quiz_wheelz.enums.ChallengeOutcome;
import com.quiz_wheelz.enums.ChallengeChoice;
import org.hibernate.annotations.ColumnDefault;
import jakarta.validation.constraints.Min;
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
@Check(name = "chk_challenge_execution_counters", constraints = "questions_resolved >= 0 and "
        + "correct_answers >= 0 and correct_answers <= questions_resolved")
@Check(name = "chk_challenge_execution_state", constraints = "(status <> 'SELECTED' and "
        + "questions_resolved = 0 and correct_answers = 0 and execution_ended_at_epoch_ms is null and outcome is null) or "
        + "(status = 'SELECTED' and ((choice = 'TURBO_TRIAL' and questions_resolved <= 1) or "
        + "(choice = 'SAFE_RUN' and questions_resolved <= 3)) and "
        + "((execution_ended_at_epoch_ms is null and outcome is null and "
        + "((choice = 'TURBO_TRIAL' and questions_resolved = 0) or "
        + "(choice = 'SAFE_RUN' and questions_resolved < 3))) or "
        + "(execution_ended_at_epoch_ms is not null and (outcome is null or "
        + "(choice = 'TURBO_TRIAL' and questions_resolved = 1 and "
        + "((outcome = 'TURBO_SUCCESS' and correct_answers = 1) or "
        + "(outcome = 'TURBO_FAILURE' and correct_answers = 0))) or "
        + "(choice = 'SAFE_RUN' and questions_resolved = 3 and "
        + "((outcome = 'SAFE_PERFECT' and correct_answers = 3) or "
        + "(outcome = 'SAFE_COMPLETE' and correct_answers < 3)))))))")
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

    @NotNull
    @Min(0)
    @ColumnDefault("0")
    @Column(name = "questions_resolved", nullable = false)
    private Integer questionsResolved = 0;

    @NotNull
    @Min(0)
    @ColumnDefault("0")
    @Column(name = "correct_answers", nullable = false)
    private Integer correctAnswers = 0;

    @Column(name = "execution_ended_at_epoch_ms")
    private Long executionEndedAtEpochMs;

    @Enumerated(EnumType.STRING)
    @Column(length = 30)
    private ChallengeOutcome outcome;
}
