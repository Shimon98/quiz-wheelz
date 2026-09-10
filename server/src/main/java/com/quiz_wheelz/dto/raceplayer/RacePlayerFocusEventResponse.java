package com.quiz_wheelz.dto.raceplayer;

import com.quiz_wheelz.enums.RacePlayerFocusEventOutcome;
import com.quiz_wheelz.enums.RacePlayerFocusEventType;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.UUID;

@Getter
@AllArgsConstructor
public class RacePlayerFocusEventResponse {

    private UUID eventId;
    private RacePlayerFocusEventType type;
    private RacePlayerFocusEventOutcome outcome;
    private int focusLossCount;
    private int questionFocusLossCount;
    private Long activeQuestionId;
    private long recordedAtEpochMs;
}
