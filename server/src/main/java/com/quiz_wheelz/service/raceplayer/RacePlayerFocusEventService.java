package com.quiz_wheelz.service.raceplayer;

import com.quiz_wheelz.common.RaceFocusRules;
import com.quiz_wheelz.dto.raceplayer.RacePlayerFocusEventRequest;
import com.quiz_wheelz.dto.raceplayer.RacePlayerFocusEventResponse;
import com.quiz_wheelz.entitys.PlayerQuestion;
import com.quiz_wheelz.entitys.Race;
import com.quiz_wheelz.entitys.RacePlayer;
import com.quiz_wheelz.entitys.RacePlayerFocusEvent;
import com.quiz_wheelz.enums.PlayerQuestionStatus;
import com.quiz_wheelz.enums.RaceFocusPolicy;
import com.quiz_wheelz.enums.RacePlayerFocusEventOutcome;
import com.quiz_wheelz.enums.RacePlayerFocusEventType;
import com.quiz_wheelz.enums.RacePlayerFocusState;
import com.quiz_wheelz.enums.RacePlayerStatus;
import com.quiz_wheelz.enums.RaceStatus;
import com.quiz_wheelz.exception.ApiException;
import com.quiz_wheelz.exception.ErrorCode;
import com.quiz_wheelz.repository.PlayerQuestionRepository;
import com.quiz_wheelz.repository.RacePlayerFocusEventRepository;
import com.quiz_wheelz.service.question.QuestionTimeoutService;
import com.quiz_wheelz.utils.DateTimeUtils;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;

@Service
public class RacePlayerFocusEventService {

    private final RacePlayerSessionLockService sessionLockService;
    private final RacePlayerFocusEventRepository focusEventRepository;
    private final PlayerQuestionRepository playerQuestionRepository;
    private final RacePlayerGameplayPresenceService gameplayPresenceService;
    private final QuestionTimeoutService questionTimeoutService;
    private final Clock clock;

    public RacePlayerFocusEventService(
            RacePlayerSessionLockService sessionLockService,
            RacePlayerFocusEventRepository focusEventRepository,
            PlayerQuestionRepository playerQuestionRepository,
            RacePlayerGameplayPresenceService gameplayPresenceService,
            QuestionTimeoutService questionTimeoutService,
            Clock clock
    ) {
        this.sessionLockService = Objects.requireNonNull(sessionLockService);
        this.focusEventRepository = Objects.requireNonNull(focusEventRepository);
        this.playerQuestionRepository = Objects.requireNonNull(playerQuestionRepository);
        this.gameplayPresenceService = Objects.requireNonNull(gameplayPresenceService);
        this.questionTimeoutService = Objects.requireNonNull(questionTimeoutService);
        this.clock = Objects.requireNonNull(clock);
    }

    @Transactional
    public RacePlayerFocusEventResponse recordFocusEvent(
            HttpServletRequest httpRequest,
            RacePlayerFocusEventRequest request
    ) {
        RacePlayer racePlayer = sessionLockService.resolveAndLock(httpRequest);
        String clientEventId = request.getEventId().toString();

        Optional<RacePlayerFocusEvent> existing = focusEventRepository
                .findByRacePlayerAndClientEventId(racePlayer, clientEventId);

        if (existing.isPresent()) {
            return replay(existing.get(), request.getType());
        }

        Instant decisionInstant = clock.instant();
        LocalDateTime decisionTime = DateTimeUtils.toLocalDateTime(
                decisionInstant,
                clock.getZone()
        );
        RaceFocusPolicy focusPolicy = resolveFocusPolicy(racePlayer);
        PlayerQuestion activeQuestion = request.getType() == RacePlayerFocusEventType.TAB_HIDDEN
                && focusPolicy == RaceFocusPolicy.OFF
                ? null
                : resolveActiveQuestion(racePlayer, decisionTime);
        FocusDecision decision = applyFocusEvent(
                racePlayer,
                request.getType(),
                focusPolicy,
                activeQuestion,
                decisionInstant,
                decisionTime
        );
        RacePlayerFocusEvent event = persistEvent(
                racePlayer,
                clientEventId,
                request.getType(),
                decision,
                decisionTime
        );

        return toResponse(event);
    }

    private RacePlayerFocusEventResponse replay(
            RacePlayerFocusEvent event,
            RacePlayerFocusEventType requestedType
    ) {
        if (event.getType() != requestedType) {
            throw new ApiException(ErrorCode.FOCUS_EVENT_REPLAY_CONFLICT);
        }

        return toResponse(event);
    }

    private PlayerQuestion resolveActiveQuestion(
            RacePlayer racePlayer,
            LocalDateTime decisionTime
    ) {
        if (!isActivelyRacing(racePlayer)) {
            return null;
        }

        return playerQuestionRepository
                .findFirstByRacePlayerAndStatusOrderByCreatedAtDesc(
                        racePlayer,
                        PlayerQuestionStatus.ACTIVE
                )
                .filter(question -> !DateTimeUtils.isExpired(
                        question.getExpiresAt(),
                        decisionTime
                ))
                .orElse(null);
    }

    private FocusDecision applyFocusEvent(
            RacePlayer racePlayer,
            RacePlayerFocusEventType type,
            RaceFocusPolicy focusPolicy,
            PlayerQuestion activeQuestion,
            Instant decisionInstant,
            LocalDateTime decisionTime
    ) {
        if (type == RacePlayerFocusEventType.TAB_VISIBLE) {
            racePlayer.setFocusState(RacePlayerFocusState.VISIBLE);
            return uncountedDecision(
                    racePlayer,
                    activeQuestion,
                    RacePlayerFocusEventOutcome.VISIBLE
            );
        }

        if (focusPolicy == RaceFocusPolicy.OFF) {
            racePlayer.setFocusState(RacePlayerFocusState.HIDDEN);
            return uncountedDecision(
                    racePlayer,
                    null,
                    RacePlayerFocusEventOutcome.IGNORED
            );
        }

        if (racePlayer.getFocusState() == RacePlayerFocusState.HIDDEN
                || activeQuestion == null) {
            return uncountedDecision(
                    racePlayer,
                    activeQuestion,
                    RacePlayerFocusEventOutcome.IGNORED
            );
        }

        int focusLossCountAfter = currentFocusLossCount(racePlayer) + 1;
        int questionFocusLossCountAfter = Math.toIntExact(
                focusEventRepository
                        .countByRacePlayerAndPlayerQuestionAndCountedFocusLossTrue(
                                racePlayer,
                                activeQuestion
                        )
        ) + 1;

        RacePlayerFocusEventOutcome outcome = resolveCountedOutcome(
                focusPolicy,
                questionFocusLossCountAfter
        );

        if (outcome == RacePlayerFocusEventOutcome.FORFEITED) {
            long movementCutoffEpochMs = gameplayPresenceService
                    .resolveUntrustedActivityCutoff(racePlayer, decisionInstant);
            questionTimeoutService.forfeitActiveQuestionAsTimeout(
                    racePlayer,
                    activeQuestion,
                    decisionInstant.toEpochMilli(),
                    movementCutoffEpochMs
            );
        }

        racePlayer.setFocusState(RacePlayerFocusState.HIDDEN);
        racePlayer.setFocusLossCount(focusLossCountAfter);
        racePlayer.setLastFocusLossAt(decisionTime);

        return new FocusDecision(
                activeQuestion,
                outcome,
                true,
                focusLossCountAfter,
                questionFocusLossCountAfter
        );
    }

    private RacePlayerFocusEventOutcome resolveCountedOutcome(
            RaceFocusPolicy focusPolicy,
            int questionFocusLossCountAfter
    ) {
        if (questionFocusLossCountAfter == 1) {
            return RacePlayerFocusEventOutcome.WARNING;
        }

        if (focusPolicy == RaceFocusPolicy.STRICT
                && questionFocusLossCountAfter
                == RaceFocusRules.STRICT_FORFEIT_THRESHOLD) {
            return RacePlayerFocusEventOutcome.FORFEITED;
        }

        return RacePlayerFocusEventOutcome.VIOLATION;
    }

    private FocusDecision uncountedDecision(
            RacePlayer racePlayer,
            PlayerQuestion activeQuestion,
            RacePlayerFocusEventOutcome outcome
    ) {
        int questionFocusLossCount = activeQuestion == null
                ? 0
                : Math.toIntExact(
                        focusEventRepository
                                .countByRacePlayerAndPlayerQuestionAndCountedFocusLossTrue(
                                        racePlayer,
                                        activeQuestion
                                )
                );

        return new FocusDecision(
                activeQuestion,
                outcome,
                false,
                currentFocusLossCount(racePlayer),
                questionFocusLossCount
        );
    }

    private RacePlayerFocusEvent persistEvent(
            RacePlayer racePlayer,
            String clientEventId,
            RacePlayerFocusEventType type,
            FocusDecision decision,
            LocalDateTime decisionTime
    ) {
        RacePlayerFocusEvent event = new RacePlayerFocusEvent();
        event.setRacePlayer(racePlayer);
        event.setClientEventId(clientEventId);
        event.setType(type);
        event.setPlayerQuestion(decision.activeQuestion());
        event.setOutcome(decision.outcome());
        event.setCountedFocusLoss(decision.countedFocusLoss());
        event.setFocusLossCountAfter(decision.focusLossCountAfter());
        event.setQuestionFocusLossCountAfter(decision.questionFocusLossCountAfter());
        event.setRecordedAt(decisionTime);
        return focusEventRepository.save(event);
    }

    private RacePlayerFocusEventResponse toResponse(RacePlayerFocusEvent event) {
        Long activeQuestionId = event.getPlayerQuestion() == null
                ? null
                : event.getPlayerQuestion().getId();

        return new RacePlayerFocusEventResponse(
                UUID.fromString(event.getClientEventId()),
                event.getType(),
                event.getOutcome(),
                event.getFocusLossCountAfter(),
                event.getQuestionFocusLossCountAfter(),
                activeQuestionId,
                DateTimeUtils.toEpochMilli(event.getRecordedAt(), clock.getZone())
        );
    }

    private boolean isActivelyRacing(RacePlayer racePlayer) {
        Race race = racePlayer.getRace();
        return racePlayer.getStatus() == RacePlayerStatus.RACING
                && race != null
                && race.getStatus() == RaceStatus.IN_PROGRESS;
    }

    private RaceFocusPolicy resolveFocusPolicy(RacePlayer racePlayer) {
        Race race = racePlayer.getRace();
        return race == null || race.getFocusPolicy() == null
                ? RaceFocusPolicy.WARN
                : race.getFocusPolicy();
    }

    private int currentFocusLossCount(RacePlayer racePlayer) {
        return racePlayer.getFocusLossCount() == null
                ? 0
                : racePlayer.getFocusLossCount();
    }

    private record FocusDecision(
            PlayerQuestion activeQuestion,
            RacePlayerFocusEventOutcome outcome,
            boolean countedFocusLoss,
            int focusLossCountAfter,
            int questionFocusLossCountAfter
    ) {
    }
}
