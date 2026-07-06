package com.quiz_wheelz.dto.answer;

import com.quiz_wheelz.dto.raceengine.AnswerRaceImpact;
import com.quiz_wheelz.dto.raceplayer.StudentRaceRuntimeSnapshotResponse;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.Objects;

@Getter
@AllArgsConstructor
public class StudentAnswerRaceImpactResponse {

    private Integer scoreDelta;
    private Double progressDelta;

    private boolean difficultyChanged;

    private StudentRaceRuntimeSnapshotResponse snapshot;

    public static StudentAnswerRaceImpactResponse from(
            AnswerRaceImpact impact,
            StudentRaceRuntimeSnapshotResponse snapshot
    ) {
        Objects.requireNonNull(impact);
        Objects.requireNonNull(snapshot);

        return new StudentAnswerRaceImpactResponse(
                impact.getScoreDelta(),
                impact.getProgressDelta(),
                impact.isDifficultyChanged(),
                snapshot
        );
    }
}
