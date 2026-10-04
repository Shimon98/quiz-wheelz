package com.quiz_wheelz.service.raceplayer;

import com.quiz_wheelz.dto.raceengine.AnswerRaceImpact;
import com.quiz_wheelz.dto.raceplayer.StudentRaceRuntimeSnapshotResponse;
import com.quiz_wheelz.entitys.RacePlayer;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class StudentRaceRuntimeSnapshotService {

    private final StudentRaceRuntimeSnapshotMapper mapper;
    private final StudentRaceGameplayProjectionService gameplayService;

    public StudentRaceRuntimeSnapshotResponse fromRacePlayer(
            RacePlayer player, StudentRaceStandingResult standing,
            long snapshotAtEpochMs, long eventVersion
    ) {
        return mapper.fromRacePlayer(player, standing, snapshotAtEpochMs, eventVersion,
                gameplayService.resolve(player, player.getRace().getStatus(), player.getStatus(),
                        player.getSpeed(), snapshotAtEpochMs));
    }

    public StudentRaceRuntimeSnapshotResponse fromAnswerRaceImpact(
            AnswerRaceImpact impact, RacePlayer player, StudentRaceStandingResult standing,
            long snapshotAtEpochMs, long eventVersion
    ) {
        return mapper.fromAnswerRaceImpact(impact, player, standing, snapshotAtEpochMs, eventVersion,
                gameplayService.resolve(player, impact.getRaceStatus(), impact.getPlayerStatus(),
                        impact.getNewSpeed(), snapshotAtEpochMs));
    }
}
