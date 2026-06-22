package com.quiz_wheelz.dto.raceplayer;

import com.quiz_wheelz.common.RacePlayerRules;
import com.quiz_wheelz.common.RaceRules;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RacePlayerJoinRequest {

    @NotBlank
    @Size(min = RaceRules.ROOM_CODE_LENGTH, max = RaceRules.ROOM_CODE_LENGTH)
    private String roomCode;

    @NotBlank
    @Size(
            min = RacePlayerRules.MIN_DISPLAY_NAME_LENGTH,
            max = RacePlayerRules.MAX_DISPLAY_NAME_LENGTH
    )
    private String displayName;
}
