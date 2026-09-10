package com.quiz_wheelz.service.teacher;

import com.quiz_wheelz.dto.teacher.TeacherRaceLivePlayerResponse;
import com.quiz_wheelz.entitys.Race;
import com.quiz_wheelz.repository.RacePlayerRepository;
import com.quiz_wheelz.service.raceplayer.RaceStandingCalculator;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Objects;

@Service
public class TeacherRaceLivePlayerSnapshotService {

    private final RacePlayerRepository racePlayerRepository;
    private final RaceStandingCalculator standingCalculator;

    public TeacherRaceLivePlayerSnapshotService(
            RacePlayerRepository racePlayerRepository,
            RaceStandingCalculator standingCalculator
    ) {
        this.racePlayerRepository = Objects.requireNonNull(racePlayerRepository);
        this.standingCalculator = Objects.requireNonNull(standingCalculator);
    }

    public List<TeacherRaceLivePlayerResponse> getOrderedPlayers(Race race) {
        return standingCalculator.calculate(
                        racePlayerRepository.findByRaceOrderByLaneNumberAsc(race)
                )
                .stream()
                .map(standing -> TeacherRaceLivePlayerResponse.from(
                        standing.racePlayer(),
                        standing.rank()
                ))
                .toList();
    }
}
