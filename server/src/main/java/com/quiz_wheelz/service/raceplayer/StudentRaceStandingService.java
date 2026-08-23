package com.quiz_wheelz.service.raceplayer;

import com.quiz_wheelz.entitys.Race;
import com.quiz_wheelz.entitys.RacePlayer;
import com.quiz_wheelz.enums.RacePlayerStatus;
import com.quiz_wheelz.repository.RacePlayerRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;

@Service
public class StudentRaceStandingService {

    private static final int MAX_NEARBY_PLAYERS = 4;
    private static final int PREFERRED_PLAYERS_PER_SIDE = 2;

    private static final Comparator<LocalDateTime> FINISH_TIME_ORDER =
            Comparator.nullsLast(Comparator.naturalOrder());

    private static final Comparator<RacePlayer> STABLE_TIE_ORDER =
            Comparator.comparing(
                            RacePlayer::getId,
                            Comparator.nullsLast(Comparator.naturalOrder())
                    )
                    .thenComparing(
                            RacePlayer::getLaneNumber,
                            Comparator.nullsLast(Comparator.naturalOrder())
                    )
                    .thenComparing(
                            RacePlayer::getDisplayName,
                            Comparator.nullsLast(Comparator.naturalOrder())
                    );

    private final RacePlayerRepository racePlayerRepository;

    public StudentRaceStandingService(RacePlayerRepository racePlayerRepository) {
        this.racePlayerRepository = Objects.requireNonNull(racePlayerRepository);
    }

    public StudentRaceStandingResult calculate(RacePlayer currentRacePlayer) {
        Objects.requireNonNull(currentRacePlayer);
        Race race = Objects.requireNonNull(currentRacePlayer.getRace());
        Long currentRacePlayerId = Objects.requireNonNull(currentRacePlayer.getId());

        List<RacePlayer> orderedPlayers = new ArrayList<>(
                racePlayerRepository.findByRaceOrderByLaneNumberAsc(race)
        );
        orderedPlayers.sort(this::compareStanding);

        int currentIndex = findCurrentIndex(orderedPlayers, currentRacePlayerId);
        int rank = calculateCompetitionRank(orderedPlayers, currentIndex);
        List<StudentRaceStandingResult.NearbyPlayer> nearbyPlayers =
                selectNearbyPlayers(orderedPlayers, currentIndex);

        return new StudentRaceStandingResult(rank, orderedPlayers.size(), nearbyPlayers);
    }

    private int compareStanding(RacePlayer left, RacePlayer right) {
        int competitiveOrder = compareCompetitiveStanding(left, right);

        return competitiveOrder != 0
                ? competitiveOrder
                : STABLE_TIE_ORDER.compare(left, right);
    }

    private int compareCompetitiveStanding(RacePlayer left, RacePlayer right) {
        boolean leftFinished = isFinished(left);
        boolean rightFinished = isFinished(right);

        if (leftFinished != rightFinished) {
            return leftFinished ? -1 : 1;
        }

        if (leftFinished) {
            return FINISH_TIME_ORDER.compare(left.getFinishedAt(), right.getFinishedAt());
        }

        return Double.compare(safePosition(right), safePosition(left));
    }

    private int findCurrentIndex(List<RacePlayer> orderedPlayers, Long currentRacePlayerId) {
        for (int index = 0; index < orderedPlayers.size(); index++) {
            if (currentRacePlayerId.equals(orderedPlayers.get(index).getId())) {
                return index;
            }
        }

        throw new IllegalStateException();
    }

    private int calculateCompetitionRank(List<RacePlayer> orderedPlayers, int currentIndex) {
        int rank = 1;

        for (int index = 1; index <= currentIndex; index++) {
            if (!sharesCompetitiveStanding(
                    orderedPlayers.get(index - 1),
                    orderedPlayers.get(index)
            )) {
                rank = index + 1;
            }
        }

        return rank;
    }

    private boolean sharesCompetitiveStanding(RacePlayer left, RacePlayer right) {
        boolean leftFinished = isFinished(left);
        boolean rightFinished = isFinished(right);

        if (leftFinished != rightFinished) {
            return false;
        }

        if (leftFinished) {
            return Objects.equals(left.getFinishedAt(), right.getFinishedAt());
        }

        return Double.compare(safePosition(left), safePosition(right)) == 0;
    }

    private List<StudentRaceStandingResult.NearbyPlayer> selectNearbyPlayers(
            List<RacePlayer> orderedPlayers,
            int currentIndex
    ) {
        int playersAhead = Math.min(PREFERRED_PLAYERS_PER_SIDE, currentIndex);
        int playersBehind = Math.min(
                PREFERRED_PLAYERS_PER_SIDE,
                orderedPlayers.size() - currentIndex - 1
        );
        int remainingSlots = MAX_NEARBY_PLAYERS - playersAhead - playersBehind;

        int additionalAhead = Math.min(remainingSlots, currentIndex - playersAhead);
        playersAhead += additionalAhead;
        remainingSlots -= additionalAhead;

        int availableBehind = orderedPlayers.size() - currentIndex - 1 - playersBehind;
        playersBehind += Math.min(remainingSlots, availableBehind);

        List<StudentRaceStandingResult.NearbyPlayer> nearbyPlayers = new ArrayList<>();
        int firstIndex = currentIndex - playersAhead;
        int lastIndex = currentIndex + playersBehind;

        for (int index = firstIndex; index <= lastIndex; index++) {
            if (index != currentIndex) {
                nearbyPlayers.add(toNearbyPlayer(orderedPlayers.get(index)));
            }
        }

        return List.copyOf(nearbyPlayers);
    }

    private StudentRaceStandingResult.NearbyPlayer toNearbyPlayer(RacePlayer racePlayer) {
        return new StudentRaceStandingResult.NearbyPlayer(
                racePlayer.getId(),
                racePlayer.getDisplayName(),
                racePlayer.getLaneNumber(),
                racePlayer.getVehicleTypeKey(),
                racePlayer.getVehicleColorKey(),
                racePlayer.getPosition(),
                racePlayer.getSpeed(),
                racePlayer.getStatus()
        );
    }

    private boolean isFinished(RacePlayer racePlayer) {
        return racePlayer.getStatus() == RacePlayerStatus.FINISHED;
    }

    private double safePosition(RacePlayer racePlayer) {
        return racePlayer.getPosition() == null ? 0.0 : racePlayer.getPosition();
    }
}
