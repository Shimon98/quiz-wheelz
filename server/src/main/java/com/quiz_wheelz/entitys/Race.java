package com.quiz_wheelz.entitys;

import com.quiz_wheelz.common.BaseEntity;
import com.quiz_wheelz.common.RaceRules;
import com.quiz_wheelz.enums.RaceStatus;
import jakarta.persistence.*;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "races")
@Getter
@Setter
@NoArgsConstructor
public class Race extends BaseEntity {

    @NotBlank
    @Size(max = RaceRules.ROOM_CODE_LENGTH)
    @Column(name = "room_code", nullable = false, unique = true, length = RaceRules.ROOM_CODE_LENGTH)
    private String roomCode;

    @NotBlank
    @Size(min = RaceRules.MIN_TITLE_LENGTH, max = RaceRules.MAX_TITLE_LENGTH)
    @Column(nullable = false, length = RaceRules.MAX_TITLE_LENGTH)
    private String title;;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private RaceStatus status = RaceStatus.WAITING_FOR_PLAYERS;

    @NotNull
    @Min(RaceRules.MIN_PLAYERS)
    @Max(RaceRules.MAX_PLAYERS)
    @Column(name = "max_players", nullable = false)
    private Integer maxPlayers;

    @NotNull
    @Min(RaceRules.MIN_TOTAL_DISTANCE)
    @Column(name = "total_distance", nullable = false)
    private Integer totalDistance;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "teacher_id", nullable = false)
    private User teacher;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "subject_id", nullable = false)
    private Subject subject;

    @Column(name = "started_at")
    private LocalDateTime startedAt;

    @Column(name = "finished_at")
    private LocalDateTime finishedAt;
}