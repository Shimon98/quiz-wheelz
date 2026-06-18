package com.quiz_wheelz.dto.race;

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
    @Min(1)
    @Max(8)
    private Integer maxPlayers;

    @NotNull
    @Min(100)
    private Integer totalDistance;
}