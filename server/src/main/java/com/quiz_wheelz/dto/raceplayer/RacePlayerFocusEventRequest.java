package com.quiz_wheelz.dto.raceplayer;

import com.quiz_wheelz.enums.RacePlayerFocusEventType;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
public class RacePlayerFocusEventRequest {

    @NotNull
    private UUID eventId;

    @NotNull
    private RacePlayerFocusEventType type;
}
