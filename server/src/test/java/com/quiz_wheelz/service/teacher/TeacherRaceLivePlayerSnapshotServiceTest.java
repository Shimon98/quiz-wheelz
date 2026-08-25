package com.quiz_wheelz.service.teacher;

import com.quiz_wheelz.dto.teacher.TeacherRaceLivePlayerResponse;
import com.quiz_wheelz.entitys.Race;
import com.quiz_wheelz.entitys.RacePlayer;
import com.quiz_wheelz.enums.RacePlayerStatus;
import com.quiz_wheelz.repository.RacePlayerRepository;
import com.quiz_wheelz.service.raceplayer.RaceStandingCalculator;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TeacherRaceLivePlayerSnapshotServiceTest {

    @Mock
    private RacePlayerRepository racePlayerRepository;

    @Test
    void fullSnapshotRecalculatesEveryAffectedRankAfterOvertake() {
        Race race = new Race();
        RacePlayer maya = player(1L, "Maya", 1, 30.0);
        RacePlayer noa = player(2L, "Noa", 2, 20.0);
        when(racePlayerRepository.findByRaceOrderByLaneNumberAsc(race))
                .thenReturn(List.of(maya, noa));
        TeacherRaceLivePlayerSnapshotService service = service();

        List<TeacherRaceLivePlayerResponse> before = service.getOrderedPlayers(race);
        noa.setPosition(40.0);
        List<TeacherRaceLivePlayerResponse> after = service.getOrderedPlayers(race);

        assertEquals(List.of("Maya", "Noa"), names(before));
        assertEquals(List.of(1, 2), ranks(before));
        assertEquals(List.of("Noa", "Maya"), names(after));
        assertEquals(List.of(1, 2), ranks(after));
    }

    @Test
    void competitionTiesArePreservedInTheSharedSnapshot() {
        Race race = new Race();
        RacePlayer first = player(1L, "Maya", 1, 50.0);
        RacePlayer second = player(2L, "Noa", 2, 50.0);
        RacePlayer third = player(3L, "Ari", 3, 20.0);
        when(racePlayerRepository.findByRaceOrderByLaneNumberAsc(race))
                .thenReturn(List.of(third, second, first));

        List<TeacherRaceLivePlayerResponse> players = service().getOrderedPlayers(race);

        assertEquals(List.of("Maya", "Noa", "Ari"), names(players));
        assertEquals(List.of(1, 1, 3), ranks(players));
    }

    private TeacherRaceLivePlayerSnapshotService service() {
        return new TeacherRaceLivePlayerSnapshotService(
                racePlayerRepository,
                new RaceStandingCalculator()
        );
    }

    private RacePlayer player(Long id, String name, int lane, double position) {
        RacePlayer player = new RacePlayer();
        player.setId(id);
        player.setDisplayName(name);
        player.setLaneNumber(lane);
        player.setStatus(RacePlayerStatus.RACING);
        player.setPosition(position);
        player.setSpeed(4.0);
        player.setScore(10);
        player.setStreak(1);
        player.setVehicleTypeKey("TOY_CAR");
        player.setVehicleColorKey("RED");
        return player;
    }

    private List<String> names(List<TeacherRaceLivePlayerResponse> players) {
        return players.stream().map(TeacherRaceLivePlayerResponse::getDisplayName).toList();
    }

    private List<Integer> ranks(List<TeacherRaceLivePlayerResponse> players) {
        return players.stream().map(TeacherRaceLivePlayerResponse::getRank).toList();
    }
}
