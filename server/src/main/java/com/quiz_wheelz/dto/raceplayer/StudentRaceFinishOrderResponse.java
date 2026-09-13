package com.quiz_wheelz.dto.raceplayer;

import com.quiz_wheelz.service.raceengine.RaceFinishOrderPolicy.FinishOrderProof;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.List;
import java.util.Objects;

@Getter
@AllArgsConstructor
public class StudentRaceFinishOrderResponse {

    private Long decidedAtEpochMs;
    private Long eventVersion;
    private Long confirmedThroughEpochMs;
    private List<StudentRaceConfirmedFinisherResponse> confirmedFinishers;

    public static StudentRaceFinishOrderResponse from(
            FinishOrderProof proof,
            long decidedAtEpochMs,
            long eventVersion
    ) {
        Objects.requireNonNull(proof);

        return new StudentRaceFinishOrderResponse(
                decidedAtEpochMs,
                eventVersion,
                proof.confirmedThroughEpochMs(),
                proof.confirmedFinishers().stream()
                        .map(finisher -> new StudentRaceConfirmedFinisherResponse(
                                finisher.racePlayerId(),
                                finisher.finishedAtEpochMs(),
                                finisher.rank()
                        ))
                        .toList()
        );
    }
}
