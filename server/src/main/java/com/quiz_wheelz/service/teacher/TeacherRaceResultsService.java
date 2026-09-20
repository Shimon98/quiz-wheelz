package com.quiz_wheelz.service.teacher;

import com.quiz_wheelz.common.RacePlayerRules;
import com.quiz_wheelz.dto.teacher.TeacherRaceResultAwardResponse;
import com.quiz_wheelz.dto.teacher.TeacherRaceResultPlayerResponse;
import com.quiz_wheelz.dto.teacher.TeacherRaceResultsResponse;
import com.quiz_wheelz.dto.teacher.TeacherRaceResultsSummaryResponse;
import com.quiz_wheelz.dto.subject.SubjectResponse;
import com.quiz_wheelz.entitys.Race;
import com.quiz_wheelz.entitys.RacePlayer;
import com.quiz_wheelz.enums.RacePlayerStatus;
import com.quiz_wheelz.enums.RaceStatus;
import com.quiz_wheelz.enums.TeacherRaceResultAwardType;
import com.quiz_wheelz.exception.ApiException;
import com.quiz_wheelz.exception.ErrorCode;
import com.quiz_wheelz.repository.RacePlayerRepository;
import com.quiz_wheelz.service.raceplayer.RaceStandingCalculator;
import com.quiz_wheelz.service.raceplayer.RaceStandingCalculator.RankedRacePlayer;
import com.quiz_wheelz.utils.DateTimeUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.function.ToIntFunction;

@Service
public class TeacherRaceResultsService {

    private final TeacherRaceAccessService raceAccessService;
    private final RacePlayerRepository racePlayerRepository;
    private final RaceStandingCalculator standingCalculator;
    private final Clock clock;

    public TeacherRaceResultsService(
            TeacherRaceAccessService raceAccessService,
            RacePlayerRepository racePlayerRepository,
            RaceStandingCalculator standingCalculator,
            Clock clock
    ) {
        this.raceAccessService = Objects.requireNonNull(raceAccessService);
        this.racePlayerRepository = Objects.requireNonNull(racePlayerRepository);
        this.standingCalculator = Objects.requireNonNull(standingCalculator);
        this.clock = Objects.requireNonNull(clock);
    }

    @Transactional(readOnly = true)
    public TeacherRaceResultsResponse getResults(Long raceId) {
        Race race = raceAccessService.requireOwnedRace(raceId);
        requireFinished(race);

        List<RankedRacePlayer> standings = standingCalculator.calculate(
                racePlayerRepository.findByRaceOrderByLaneNumberAsc(race)
        );
        List<TeacherRaceResultPlayerResponse> players = standings.stream()
                .map(this::mapPlayer)
                .toList();

        return new TeacherRaceResultsResponse(
                race.getId(),
                race.getTitle(),
                race.getRoomCode(),
                SubjectResponse.from(race.getSubject()),
                race.getStatus().name(),
                race.getMaxPlayers(),
                players.size(),
                race.getTotalDistance(),
                toEpochMilliOrNull(race.getStartedAt()),
                toEpochMilliOrNull(race.getFinishedAt()),
                winnerIds(standings),
                summarize(standings),
                awards(standings),
                players
        );
    }

    private void requireFinished(Race race) {
        if (race.getStatus() != RaceStatus.FINISHED) {
            throw new ApiException(ErrorCode.RACE_RESULTS_NOT_AVAILABLE);
        }
    }

    private TeacherRaceResultPlayerResponse mapPlayer(RankedRacePlayer standing) {
        RacePlayer player = standing.racePlayer();
        Long finishedAtEpochMs = player.getStatus() == RacePlayerStatus.FINISHED
                ? standingCalculator.resolveFinishedAtEpochMs(player)
                : null;

        return new TeacherRaceResultPlayerResponse(
                player.getId(),
                player.getDisplayName(),
                player.getLaneNumber(),
                player.getVehicleTypeKey(),
                player.getVehicleColorKey(),
                RacePlayerRules.buildVehicleAssetKey(
                        player.getVehicleTypeKey(),
                        player.getVehicleColorKey()
                ),
                standing.rank(),
                player.getScore(),
                player.getCorrectAnswers(),
                player.getWrongAnswers(),
                player.getHighestStreak(),
                player.getPosition(),
                player.getStatus().name(),
                finishedAtEpochMs
        );
    }

    private List<Long> winnerIds(List<RankedRacePlayer> standings) {
        return standings.stream()
                .filter(standing -> standing.rank() == 1)
                .map(RankedRacePlayer::racePlayer)
                .filter(player -> player.getStatus() == RacePlayerStatus.FINISHED)
                .map(RacePlayer::getId)
                .toList();
    }

    private TeacherRaceResultsSummaryResponse summarize(List<RankedRacePlayer> standings) {
        int finishedPlayers = 0;
        int disconnectedPlayers = 0;
        int totalCorrectAnswers = 0;
        int totalWrongAnswers = 0;

        for (RankedRacePlayer standing : standings) {
            RacePlayer player = standing.racePlayer();
            finishedPlayers += player.getStatus() == RacePlayerStatus.FINISHED ? 1 : 0;
            disconnectedPlayers += player.getStatus() == RacePlayerStatus.DISCONNECTED ? 1 : 0;
            totalCorrectAnswers += player.getCorrectAnswers();
            totalWrongAnswers += player.getWrongAnswers();
        }

        return new TeacherRaceResultsSummaryResponse(
                finishedPlayers,
                disconnectedPlayers,
                totalCorrectAnswers,
                totalWrongAnswers
        );
    }

    private List<TeacherRaceResultAwardResponse> awards(
            List<RankedRacePlayer> standings
    ) {
        List<TeacherRaceResultAwardResponse> awards = new ArrayList<>(3);
        addAward(awards, standings, TeacherRaceResultAwardType.HIGHEST_SCORE, RacePlayer::getScore);
        addAward(
                awards,
                standings,
                TeacherRaceResultAwardType.MOST_CORRECT_ANSWERS,
                RacePlayer::getCorrectAnswers
        );
        addAward(
                awards,
                standings,
                TeacherRaceResultAwardType.BEST_STREAK,
                RacePlayer::getHighestStreak
        );
        return List.copyOf(awards);
    }

    private void addAward(
            List<TeacherRaceResultAwardResponse> awards,
            List<RankedRacePlayer> standings,
            TeacherRaceResultAwardType type,
            ToIntFunction<RacePlayer> value
    ) {
        int maximum = standings.stream()
                .map(RankedRacePlayer::racePlayer)
                .mapToInt(value)
                .max()
                .orElse(0);

        if (maximum <= 0) {
            return;
        }

        List<Long> racePlayerIds = standings.stream()
                .map(RankedRacePlayer::racePlayer)
                .filter(player -> value.applyAsInt(player) == maximum)
                .map(RacePlayer::getId)
                .toList();
        awards.add(new TeacherRaceResultAwardResponse(type, racePlayerIds, maximum));
    }

    private Long toEpochMilliOrNull(LocalDateTime value) {
        return value == null
                ? null
                : DateTimeUtils.toEpochMilli(value, clock.getZone());
    }
}
