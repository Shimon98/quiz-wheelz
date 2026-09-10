package com.quiz_wheelz.dto.raceplayer;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class StudentRaceFinishArbitrationResponse {

    private Long raceId;
    private StudentRaceRuntimeSnapshotResponse snapshot;
    private StudentRaceFinishOrderResponse finishOrder;
}
