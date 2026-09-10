package com.quiz_wheelz.service.raceplayer;

import com.quiz_wheelz.entitys.RacePlayer;
import com.quiz_wheelz.enums.RacePlayerStatus;
import com.quiz_wheelz.utils.DateTimeUtils;
import org.springframework.stereotype.Component;

import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;

@Component
public class RaceStandingCalculator {

    private static final long UNKNOWN_FINISH_ORDER_KEY = Long.MAX_VALUE;

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

    private final ZoneId zoneId;

    public RaceStandingCalculator(ZoneId applicationZoneId) {
        this.zoneId = Objects.requireNonNull(applicationZoneId);
    }

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

    public long finishOrderKey(RacePlayer racePlayer) {
        if (racePlayer.getFinishedAtEpochMs() != null) {
            return racePlayer.getFinishedAtEpochMs();
        }

        if (racePlayer.getFinishedAt() != null) {
            return DateTimeUtils.toEpochMilli(racePlayer.getFinishedAt(), zoneId);
        }

        return UNKNOWN_FINISH_ORDER_KEY;
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
            return Long.compare(finishOrderKey(left), finishOrderKey(right));
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
            return finishOrderKey(left) == finishOrderKey(right);
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
