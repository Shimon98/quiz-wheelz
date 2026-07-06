package com.quiz_wheelz.service.raceplayer;

import com.quiz_wheelz.dto.raceplayer.StudentRaceRuntimeSnapshotResponse;
import com.quiz_wheelz.dto.raceplayer.StudentRaceStateResponse;
import com.quiz_wheelz.entitys.Race;
import com.quiz_wheelz.entitys.RacePlayer;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Objects;

@Service
public class StudentRaceStateService {

    private final CurrentRacePlayerService currentRacePlayerService;
    private final StudentRaceRuntimeSnapshotMapper snapshotMapper;

    public StudentRaceStateService(
            CurrentRacePlayerService currentRacePlayerService,
            StudentRaceRuntimeSnapshotMapper snapshotMapper
    ) {
        this.currentRacePlayerService = Objects.requireNonNull(currentRacePlayerService);
        this.snapshotMapper = Objects.requireNonNull(snapshotMapper);
    }

    @Transactional(readOnly = true)
    public StudentRaceStateResponse getRaceState(HttpServletRequest request) {
        RacePlayer racePlayer =
                currentRacePlayerService.resolveCurrentRacePlayerSession(request);

        Race race = Objects.requireNonNull(racePlayer.getRace());

        StudentRaceRuntimeSnapshotResponse snapshot =
                snapshotMapper.fromRacePlayer(racePlayer);

        return new StudentRaceStateResponse(
                race.getId(),
                race.getTitle(),
                race.getRoomCode(),
                race.getStartedAt(),
                race.getFinishedAt(),
                snapshot
        );
    }
}
