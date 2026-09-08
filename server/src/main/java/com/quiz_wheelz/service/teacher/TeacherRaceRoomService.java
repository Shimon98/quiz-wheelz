package com.quiz_wheelz.service.teacher;

import com.quiz_wheelz.dto.teacher.TeacherRaceRoomResponse;
import com.quiz_wheelz.entitys.Race;
import com.quiz_wheelz.entitys.RacePlayer;
import com.quiz_wheelz.service.raceplayer.RacePlayerService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class TeacherRaceRoomService {

    private final TeacherRaceAccessService raceAccessService;
    private final RacePlayerService racePlayerService;

    public TeacherRaceRoomService(
            TeacherRaceAccessService raceAccessService,
            RacePlayerService racePlayerService) {

        this.raceAccessService = raceAccessService;
        this.racePlayerService = racePlayerService;
    }

    @Transactional(readOnly = true)
    public TeacherRaceRoomResponse getRaceRoom(Long raceId) {
        Race race = raceAccessService.requireOwnedRace(raceId);
        List<RacePlayer> players = racePlayerService.findPlayersByRaceOrderedByLane(race);

        return TeacherRaceRoomResponse.from(race, players);
    }
}
