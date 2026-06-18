package com.quiz_wheelz.entitys;

import com.quiz_wheelz.common.BaseEntity;
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
    @Size(max = 20)
    @Column(name = "room_code", nullable = false, unique = true, length = 20)
    private String roomCode;

    @NotBlank
    @Size(max = 120)
    @Column(nullable = false, length = 120)
    private String title;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private RaceStatus status = RaceStatus.WAITING_FOR_PLAYERS;

    @NotNull
    @Min(1)
    @Max(8)
    @Column(name = "max_players", nullable = false)
    private Integer maxPlayers;

    @NotNull
    @Min(100)
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