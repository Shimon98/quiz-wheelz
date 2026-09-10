package com.quiz_wheelz.service.raceplayer;

import com.quiz_wheelz.dto.raceplayer.RacePlayerSessionIdentity;
import com.quiz_wheelz.dto.raceplayer.StudentRaceFinishArbitrationResponse;
import com.quiz_wheelz.dto.raceplayer.StudentRaceFinishOrderResponse;
import com.quiz_wheelz.dto.raceplayer.StudentRaceRuntimeSnapshotResponse;
import com.quiz_wheelz.entitys.Race;
import com.quiz_wheelz.entitys.RacePlayer;
import com.quiz_wheelz.enums.RacePlayerStatus;
import com.quiz_wheelz.enums.RaceStatus;
import com.quiz_wheelz.exception.ApiException;
import com.quiz_wheelz.exception.ErrorCode;
import com.quiz_wheelz.repository.RacePlayerRepository;
import com.quiz_wheelz.repository.RaceRepository;
import com.quiz_wheelz.service.liveevent.RaceLiveEventChangeRecorder;
import com.quiz_wheelz.service.liveevent.RaceLiveEventChangeRecorder.PlayerChange;
import com.quiz_wheelz.service.liveevent.RaceLiveEventChangeRecorder.PlayerLiveState;
import com.quiz_wheelz.service.liveevent.RaceLiveEventChangeRecorder.RaceLiveState;
import com.quiz_wheelz.service.raceengine.RaceFinishOrderPolicy;
import com.quiz_wheelz.service.raceengine.RaceDecisionTimeService;
import com.quiz_wheelz.service.raceengine.RaceFinishOrderPolicy.FinishOrderProof;
import com.quiz_wheelz.service.raceengine.RaceFinishService;
import com.quiz_wheelz.service.raceengine.RacePlayerGameplayTimelineService;
import com.quiz_wheelz.service.raceplayer.RacePlayerGameplayPresenceService.GameplayPresenceDecision;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.annotation.Isolation;

import java.time.Clock;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

@Service
public class StudentRaceFinishArbitrationService {

    private final RacePlayerSessionLockService sessionLockService;
    private final RacePlayerRepository racePlayerRepository;
    private final RaceRepository raceRepository;
    private final RacePlayerGameplayRequestGuard gameplayRequestGuard;
    private final RacePlayerGameplayPresenceService gameplayPresenceService;
    private final RacePlayerGameplayTimelineService gameplayTimelineService;
    private final RaceFinishService raceFinishService;
    private final RaceLiveEventChangeRecorder liveEventChangeRecorder;
    private final StudentRaceStandingService standingService;
    private final StudentRaceRuntimeSnapshotMapper snapshotMapper;
    private final RaceFinishOrderPolicy finishOrderPolicy;
    private final RaceDecisionTimeService decisionTimeService;
    private final Clock clock;

    public StudentRaceFinishArbitrationService(
            RacePlayerSessionLockService sessionLockService,
            RacePlayerRepository racePlayerRepository,
            RaceRepository raceRepository,
            RacePlayerGameplayRequestGuard gameplayRequestGuard,
            RacePlayerGameplayPresenceService gameplayPresenceService,
            RacePlayerGameplayTimelineService gameplayTimelineService,
            RaceFinishService raceFinishService,
            RaceLiveEventChangeRecorder liveEventChangeRecorder,
            StudentRaceStandingService standingService,
            StudentRaceRuntimeSnapshotMapper snapshotMapper,
            RaceFinishOrderPolicy finishOrderPolicy,
            RaceDecisionTimeService decisionTimeService,
            Clock clock
    ) {
        this.sessionLockService = Objects.requireNonNull(sessionLockService);
        this.racePlayerRepository = Objects.requireNonNull(racePlayerRepository);
        this.raceRepository = Objects.requireNonNull(raceRepository);
        this.gameplayRequestGuard = Objects.requireNonNull(gameplayRequestGuard);
        this.gameplayPresenceService = Objects.requireNonNull(gameplayPresenceService);
        this.gameplayTimelineService = Objects.requireNonNull(gameplayTimelineService);
        this.raceFinishService = Objects.requireNonNull(raceFinishService);
        this.liveEventChangeRecorder = Objects.requireNonNull(liveEventChangeRecorder);
        this.standingService = Objects.requireNonNull(standingService);
        this.snapshotMapper = Objects.requireNonNull(snapshotMapper);
        this.finishOrderPolicy = Objects.requireNonNull(finishOrderPolicy);
        this.decisionTimeService = Objects.requireNonNull(decisionTimeService);
        this.clock = Objects.requireNonNull(clock);
    }

    @Transactional(isolation = Isolation.READ_COMMITTED, noRollbackFor = ApiException.class)
    public StudentRaceFinishArbitrationResponse arbitrate(HttpServletRequest request) {
        RacePlayerSessionIdentity identity = sessionLockService.resolveIdentity(request);
        preflight(identity);

        List<RacePlayer> lockedPlayers = racePlayerRepository
                .findAllLockedByRaceIdOrderById(identity.raceId());
        RacePlayer requester = findRequester(lockedPlayers, identity.racePlayerId());
        Race race = raceRepository.findLockedById(identity.raceId())
                .orElseThrow(() -> new ApiException(ErrorCode.RACE_NOT_FOUND));
        requireArbitrableRace(race);

        long decisionEpochMs = decisionTimeService.advance(race, clock.millis());
        boolean clockTrusted = !isClockBehindRoster(lockedPlayers, decisionEpochMs);

        if (clockTrusted && race.getStatus() == RaceStatus.IN_PROGRESS) {
            settleRoster(race, requester, lockedPlayers, Instant.ofEpochMilli(decisionEpochMs));
        }

        return buildResponse(race, requester, lockedPlayers, decisionEpochMs, clockTrusted);
    }

    private void preflight(RacePlayerSessionIdentity identity) {
        if (!racePlayerRepository.existsByIdAndRaceId(
                identity.racePlayerId(),
                identity.raceId()
        )) {
            throw new ApiException(ErrorCode.RACE_PLAYER_NOT_FOUND);
        }

        RaceStatus raceStatus = raceRepository.findStatusById(identity.raceId());

        if (raceStatus == null) {
            throw new ApiException(ErrorCode.RACE_NOT_FOUND);
        }

        requireArbitrableStatus(raceStatus);
    }

    private RacePlayer findRequester(List<RacePlayer> lockedPlayers, Long racePlayerId) {
        return lockedPlayers.stream()
                .filter(racePlayer -> racePlayerId.equals(racePlayer.getId()))
                .findFirst()
                .orElseThrow(() -> new ApiException(ErrorCode.RACE_PLAYER_NOT_FOUND));
    }

    private void requireArbitrableRace(Race race) {
        requireArbitrableStatus(race.getStatus());

        if (race.getTotalDistance() == null) {
            throw new ApiException(ErrorCode.RACE_TOTAL_DISTANCE_MISSING);
        }
    }

    private void requireArbitrableStatus(RaceStatus raceStatus) {
        if (raceStatus != RaceStatus.IN_PROGRESS && raceStatus != RaceStatus.FINISHED) {
            throw new ApiException(ErrorCode.RACE_NOT_IN_PROGRESS);
        }
    }

    private boolean isClockBehindRoster(List<RacePlayer> lockedPlayers, long decisionEpochMs) {
        for (RacePlayer racePlayer : lockedPlayers) {
            Long anchorEpochMs = racePlayer.getMovementUpdatedAtEpochMs();
            Long finishedAtEpochMs = racePlayer.getFinishedAtEpochMs();

            if ((anchorEpochMs != null && anchorEpochMs > decisionEpochMs)
                    || (finishedAtEpochMs != null && finishedAtEpochMs > decisionEpochMs)) {
                return true;
            }
        }

        return false;
    }

    private void settleRoster(
            Race race,
            RacePlayer requester,
            List<RacePlayer> lockedPlayers,
            Instant decisionInstant
    ) {
        RaceLiveState raceBefore = liveEventChangeRecorder.captureRace(race);
        List<PlayerLiveState> playersBefore = lockedPlayers.stream()
                .map(liveEventChangeRecorder::capturePlayer)
                .toList();

        try {
            if (requester.getStatus() == RacePlayerStatus.RACING) {
                gameplayRequestGuard.requireGameplayAccess(requester, decisionInstant);
            }
        } catch (ApiException exception) {
            recordRosterChanges(race, raceBefore, lockedPlayers, playersBefore);
            throw exception;
        }

        for (RacePlayer racePlayer : lockedPlayers) {
            if (racePlayer == requester || racePlayer.getStatus() != RacePlayerStatus.RACING) {
                continue;
            }

            GameplayPresenceDecision presenceDecision =
                    gameplayPresenceService.resolve(racePlayer, decisionInstant);
            boolean disconnected = gameplayTimelineService.settleBackground(
                    racePlayer,
                    decisionInstant,
                    presenceDecision
            );

            if (disconnected) {
                gameplayPresenceService.markOffline(racePlayer);
            }
        }

        racePlayerRepository.saveAllAndFlush(lockedPlayers);
        recordRosterChanges(race, raceBefore, lockedPlayers, playersBefore);
    }

    private void recordRosterChanges(
            Race race,
            RaceLiveState raceBefore,
            List<RacePlayer> lockedPlayers,
            List<PlayerLiveState> playersBefore
    ) {
        List<PlayerChange> changes = new ArrayList<>(lockedPlayers.size());

        for (int index = 0; index < lockedPlayers.size(); index++) {
            changes.add(new PlayerChange(playersBefore.get(index), lockedPlayers.get(index)));
        }

        liveEventChangeRecorder.recordBatchPlayerChanges(race, changes);
        raceFinishService.finishRaceIfAllPlayersTerminal(race, lockedPlayers);
        liveEventChangeRecorder.recordRaceChange(raceBefore, race);
    }

    private StudentRaceFinishArbitrationResponse buildResponse(
            Race race,
            RacePlayer requester,
            List<RacePlayer> lockedPlayers,
            long decisionEpochMs,
            boolean clockTrusted
    ) {
        long eventVersion = race.getLiveEventVersion();
        StudentRaceRuntimeSnapshotResponse snapshot = snapshotMapper.fromRacePlayer(
                requester,
                standingService.calculate(requester, lockedPlayers),
                decisionEpochMs,
                eventVersion
        );
        FinishOrderProof proof = clockTrusted
                ? finishOrderPolicy.confirm(
                        lockedPlayers,
                        race.getTotalDistance(),
                        decisionEpochMs
                )
                : FinishOrderProof.unproven();

        return new StudentRaceFinishArbitrationResponse(
                race.getId(),
                snapshot,
                StudentRaceFinishOrderResponse.from(proof, decisionEpochMs, eventVersion)
        );
    }
}
