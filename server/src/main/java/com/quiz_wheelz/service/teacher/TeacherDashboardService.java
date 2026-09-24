package com.quiz_wheelz.service.teacher;

import com.quiz_wheelz.dto.race.RaceSummaryResponse;
import com.quiz_wheelz.dto.teacher.TeacherDashboardResponse;
import com.quiz_wheelz.entitys.Race;
import com.quiz_wheelz.entitys.User;
import com.quiz_wheelz.enums.RaceStatus;
import com.quiz_wheelz.repository.RacePlayerRepository;
import com.quiz_wheelz.repository.RaceRepository;
import com.quiz_wheelz.service.auth.CurrentUserService;
import com.quiz_wheelz.service.auth.UserService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class TeacherDashboardService {

    private final CurrentUserService currentUserService;
    private final UserService userService;
    private final RaceRepository raceRepository;
    private final RacePlayerRepository racePlayerRepository;

    public TeacherDashboardService(
            CurrentUserService currentUserService,
            UserService userService,
            RaceRepository raceRepository,
            RacePlayerRepository racePlayerRepository
    ) {
        this.currentUserService = currentUserService;
        this.userService = userService;
        this.raceRepository = raceRepository;
        this.racePlayerRepository = racePlayerRepository;
    }

    @Transactional(readOnly = true)
    public TeacherDashboardResponse getDashboard() {
        Long teacherId = currentUserService.getCurrentUserId();
        User teacher = userService.findActiveByIdOrThrow(teacherId);

        List<Race> races = raceRepository.findByTeacherOrderByCreatedAtDesc(teacher);

        long totalRaces = races.size();
        long activeRaces = countRacesByStatus(races, RaceStatus.IN_PROGRESS);
        long finishedRaces = countRacesByStatus(races, RaceStatus.FINISHED);
        long waitingRaces = countRacesByStatus(races, RaceStatus.WAITING_FOR_PLAYERS)
                + countRacesByStatus(races, RaceStatus.READY);

        Map<Long, Integer> playerCountsByRaceId = playerCountsByRaceId(races);

        List<RaceSummaryResponse> raceSummaries = races.stream()
                .map(race -> RaceSummaryResponse.from(
                        race,
                        playerCountsByRaceId.getOrDefault(race.getId(), 0)
                ))
                .toList();

        return new TeacherDashboardResponse(
                teacher.getDisplayName(),
                totalRaces,
                activeRaces,
                finishedRaces,
                waitingRaces,
                raceSummaries
        );
    }

    private Map<Long, Integer> playerCountsByRaceId(List<Race> races) {
        if (races.isEmpty()) {
            return Map.of();
        }

        List<Long> raceIds = races.stream()
                .map(Race::getId)
                .toList();

        return racePlayerRepository.countPlayersByRaceIds(raceIds).stream()
                .collect(Collectors.toMap(
                        RacePlayerRepository.RacePlayerCountByRace::getRaceId,
                        count -> Math.toIntExact(count.getPlayerCount())
                ));
    }

    private long countRacesByStatus(List<Race> races, RaceStatus status) {
        return races.stream()
                .filter(race -> race.getStatus() == status)
                .count();
    }
}
