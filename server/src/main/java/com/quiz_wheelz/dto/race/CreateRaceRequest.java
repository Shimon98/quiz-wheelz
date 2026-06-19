package com.quiz_wheelz.dto.race;

import com.quiz_wheelz.common.RaceRules;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateRaceRequest {

    @NotBlank
    @Size(max = 120)
    private String title;

    @NotNull
    private Long subjectId;

    @NotNull
    @Min(RaceRules.MIN_PLAYERS)
    @Max(RaceRules.MAX_PLAYERS)
    private Integer maxPlayers;

    @NotNull
    @Min(RaceRules.MIN_TOTAL_DISTANCE)
    private Integer totalDistance;
}