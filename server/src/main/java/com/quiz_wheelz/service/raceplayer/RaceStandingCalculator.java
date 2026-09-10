package com.quiz_wheelz.service.raceplayer;

import com.quiz_wheelz.entitys.RacePlayer;
import com.quiz_wheelz.enums.RacePlayerStatus;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;

@Component
public class RaceStandingCalculator {

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

    public List<RankedRacePlayer> calculate(List<RacePlayer> racePlayers) {
        List<RacePlayer> orderedPlayers = new ArrayList<>(
                Objects.requireNonNull(racePlayers)
        );
        orderedPlayers.forEach(Objects::requireNonNull);
        orderedPlayers.sort(this::compareStanding);

        List<RankedRacePlayer> rankedPlayers = new ArrayList<>(orderedPlayers.size());
        int rank = 1;

        for (int index = 0; index < orderedPlayers.size(); index++) {
            if (index > 0 && !sharesCompetitiveStanding(
                    orderedPlayers.get(index - 1),
                    orderedPlayers.get(index)
            )) {
                rank = index + 1;
            }

            rankedPlayers.add(new RankedRacePlayer(orderedPlayers.get(index), rank));
        }

        return List.copyOf(rankedPlayers);
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

    private boolean isFinished(RacePlayer racePlayer) {
        return racePlayer.getStatus() == RacePlayerStatus.FINISHED;
    }

    private double safePosition(RacePlayer racePlayer) {
        return racePlayer.getPosition() == null ? 0.0 : racePlayer.getPosition();
    }

    public record RankedRacePlayer(RacePlayer racePlayer, int rank) {

        public RankedRacePlayer {
            Objects.requireNonNull(racePlayer);
        }
    }
}
