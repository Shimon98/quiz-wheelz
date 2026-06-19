package com.quiz_wheelz.dto.teacher;

import com.quiz_wheelz.dto.race.RaceSummaryResponse;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.List;

@Getter
@AllArgsConstructor
public class TeacherDashboardResponse {

    private String teacherName;
    private long totalRaces;
    private long activeRaces;
    private long finishedRaces;
    private long waitingRaces;
    private List<RaceSummaryResponse> races;
}