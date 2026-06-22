package com.quiz_wheelz.entitys;

import com.quiz_wheelz.common.BaseEntity;
import com.quiz_wheelz.common.RacePlayerRules;
import com.quiz_wheelz.enums.Difficulty;
import com.quiz_wheelz.enums.RacePlayerStatus;
import jakarta.persistence.*;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "race_players",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_race_players_race_lane",
                        columnNames = {"race_id", "lane_number"}
                ),
                @UniqueConstraint(
                        name = "uk_race_players_race_display_name",
                        columnNames = {"race_id", "display_name_normalized"}
                )
        },
        indexes = {
                @Index(name = "idx_race_players_race_id", columnList = "race_id"),
                @Index(name = "idx_race_players_race_status", columnList = "race_id,status"),
                @Index(name = "idx_race_players_race_position", columnList = "race_id,position")
        }
)
@Getter
@Setter
@NoArgsConstructor
public class RacePlayer extends BaseEntity {

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "race_id", nullable = false)
    private Race race;

    @NotBlank
    @Size(
            min = RacePlayerRules.MIN_DISPLAY_NAME_LENGTH,
            max = RacePlayerRules.MAX_DISPLAY_NAME_LENGTH
    )
    @Column(name = "display_name", nullable = false, length = RacePlayerRules.MAX_DISPLAY_NAME_LENGTH)
    private String displayName;

    @NotNull
    @Min(RacePlayerRules.MIN_LANE_NUMBER)
    @Column(name = "lane_number", nullable = false)
    private Integer laneNumber;

    @NotBlank
    @Size(max = RacePlayerRules.MAX_VEHICLE_KEY_LENGTH)
    @Column(
            name = "vehicle_type_key",
            nullable = false,
            length = RacePlayerRules.MAX_VEHICLE_KEY_LENGTH
    )
    private String vehicleTypeKey = RacePlayerRules.DEFAULT_VEHICLE_TYPE_KEY;

    @NotBlank
    @Size(max = RacePlayerRules.MAX_VEHICLE_KEY_LENGTH)
    @Column(
            name = "vehicle_color_key",
            nullable = false,
            length = RacePlayerRules.MAX_VEHICLE_KEY_LENGTH
    )
    private String vehicleColorKey = RacePlayerRules.DEFAULT_VEHICLE_COLOR_KEY;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private RacePlayerStatus status = RacePlayerStatus.WAITING;

    @NotNull
    @PositiveOrZero
    @Column(nullable = false)
    private Double position = RacePlayerRules.DEFAULT_POSITION;

    @NotNull
    @PositiveOrZero
    @Column(nullable = false)
    private Double speed = RacePlayerRules.DEFAULT_SPEED;

    @NotNull
    @PositiveOrZero
    @Column(nullable = false)
    private Integer score = RacePlayerRules.DEFAULT_SCORE;

    @NotNull
    @PositiveOrZero
    @Column(nullable = false)
    private Integer streak = RacePlayerRules.DEFAULT_STREAK;

    @NotNull
    @PositiveOrZero
    @Column(name = "correct_answers", nullable = false)
    private Integer correctAnswers = RacePlayerRules.DEFAULT_CORRECT_ANSWERS;

    @NotNull
    @PositiveOrZero
    @Column(name = "wrong_answers", nullable = false)
    private Integer wrongAnswers = RacePlayerRules.DEFAULT_WRONG_ANSWERS;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "current_difficulty", nullable = false, length = 20)
    private Difficulty currentDifficulty = Difficulty.EASY;

    @Column(name = "joined_at", nullable = false)
    private LocalDateTime joinedAt;

    @Column(name = "started_at")
    private LocalDateTime startedAt;

    @Column(name = "finished_at")
    private LocalDateTime finishedAt;

    @Column(name = "last_seen_at")
    private LocalDateTime lastSeenAt;

    @PrePersist
    public void prePersistRacePlayer() {
        LocalDateTime now = LocalDateTime.now();

        if (joinedAt == null) {
            joinedAt = now;
        }

        if (lastSeenAt == null) {
            lastSeenAt = now;
        }
    }
}