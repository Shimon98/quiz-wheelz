package com.quiz_wheelz.service.raceplayer;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.quiz_wheelz.dto.raceplayer.StudentChallengeChoiceRequest;
import com.quiz_wheelz.enums.*;
import com.quiz_wheelz.exception.ApiException;
import com.quiz_wheelz.exception.ErrorCode;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.ValueSource;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.verifyNoInteractions;

class S4ChallengeChoiceQuestionTest extends S4ChallengeIntegrationFixture {
    @ParameterizedTest
    @EnumSource(ChallengeChoice.class)
    void selectionAndReplayPersistSameChoiceAndReconstructMode(ChallengeChoice choice) {
        Long id = openOffer();
        clock.set(T + 5_000);
        var body = new StudentChallengeChoiceRequest(id, choice.name());
        var first = choiceService.choose(secondRequest, body);
        var eventCount = eventTypes().size();
        var replay = choiceService.choose(secondRequest, body);
        assertEquals(id, first.offerId());
        assertEquals(choice, first.choice());
        assertEquals(T + 5_000, first.selectedAtEpochMs());
        assertEquals(first.selectedAtEpochMs(), replay.selectedAtEpochMs());
        assertEquals(eventCount, eventTypes().size());
        assertEquals(ChallengeOfferStatus.SELECTED, offer(id).getStatus());
        assertEquals(choice, offer(id).getChoice());
        assertEquals(RacePlayerGameplayMode.valueOf(choice.name()), snapshot().getGameplay().mode());
        assertNull(first.snapshot().getGameplay().challenge().offer());
        assertEquals(0, energy());
        clock.set(T + 20_000);
        assertEquals(first.selectedAtEpochMs(), choiceService.choose(secondRequest, body).selectedAtEpochMs());
    }

    @ParameterizedTest
    @CsvSource({"TURBO_TRIAL,FINISHED,IN_PROGRESS", "SAFE_RUN,FINISHED,IN_PROGRESS",
            "TURBO_TRIAL,RACING,FINISHED", "SAFE_RUN,RACING,FINISHED"})
    void selectedTerminalReplayPreservesSelectionAndReturnsFreshSnapshot(
            ChallengeChoice choice, RacePlayerStatus playerStatus, RaceStatus raceStatus) {
        Long id = openOffer();
        var body = new StudentChallengeChoiceRequest(id, choice.name());
        var first = choiceService.choose(secondRequest, body);
        terminalState(playerStatus, raceStatus);
        clock.set(T + 20_000);
        var replay = choiceService.choose(secondRequest, body);
        assertEquals(id, replay.offerId());
        assertEquals(choice, replay.choice());
        assertEquals(first.selectedAtEpochMs(), replay.selectedAtEpochMs());
        assertEquals(first.selectedAtEpochMs(), offer(id).getResolvedAtEpochMs());
        assertEquals(ChallengeOfferStatus.SELECTED, offer(id).getStatus());
        assertEquals(playerStatus, replay.snapshot().getPlayerStatus());
        assertEquals(raceStatus, replay.snapshot().getRaceStatus());
        assertEquals(T + 20_000, replay.snapshot().getSnapshotAtEpochMs());
        assertEquals(RacePlayerGameplayMode.NORMAL, replay.snapshot().getGameplay().mode());
        assertNull(replay.snapshot().getGameplay().challenge().offer());
        assertEquals(0.0, replay.snapshot().getGameplay().effectiveSpeed());
        assertEquals(0.0, replay.snapshot().getMovementUnitsPerSecond());
        assertTrue(replay.snapshot().getGameplay().activeEffects().isEmpty());
    }

    @ParameterizedTest
    @EnumSource(ChallengeChoice.class)
    void selectedReplaySucceedsAfterPassiveMovementFinishesPlayer(ChallengeChoice choice) {
        Long id = openOffer();
        var body = new StudentChallengeChoiceRequest(id, choice.name());
        var first = choiceService.choose(secondRequest, body);
        secondPosition(999);
        clock.set(T + 1_000);
        assertEquals(RacePlayerStatus.FINISHED, snapshot().getPlayerStatus());
        clock.set(T + 2_000);
        var replay = choiceService.choose(secondRequest, body);
        assertEquals(first.selectedAtEpochMs(), replay.selectedAtEpochMs());
        assertEquals(RacePlayerStatus.FINISHED, replay.snapshot().getPlayerStatus());
        assertEquals(RacePlayerGameplayMode.NORMAL, replay.snapshot().getGameplay().mode());
        assertEquals(0.0, replay.snapshot().getMovementUnitsPerSecond());
        assertNull(replay.snapshot().getGameplay().challenge().offer());
    }

    @ParameterizedTest
    @CsvSource({"TURBO_TRIAL,FINISHED,IN_PROGRESS", "SAFE_RUN,FINISHED,IN_PROGRESS",
            "TURBO_TRIAL,RACING,FINISHED", "SAFE_RUN,RACING,FINISHED"})
    void conflictingTerminalReplayUsesDedicatedConflict(
            ChallengeChoice choice, RacePlayerStatus playerStatus, RaceStatus raceStatus) {
        Long id = openOffer();
        var first = choiceService.choose(secondRequest, new StudentChallengeChoiceRequest(id, choice.name()));
        terminalState(playerStatus, raceStatus);
        var conflicting = choice == ChallengeChoice.TURBO_TRIAL ? ChallengeChoice.SAFE_RUN : ChallengeChoice.TURBO_TRIAL;
        error(ErrorCode.CHALLENGE_CHOICE_CONFLICT, () -> choiceService.choose(secondRequest,
                new StudentChallengeChoiceRequest(id, conflicting.name())));
        assertEquals(choice, offer(id).getChoice());
        assertEquals(first.selectedAtEpochMs(), offer(id).getResolvedAtEpochMs());
    }

    @ParameterizedTest
    @CsvSource({"FINISHED,IN_PROGRESS,RACE_PLAYER_NOT_RACING", "RACING,FINISHED,RACE_NOT_IN_PROGRESS"})
    void activeTerminalOfferCannotBeSelected(
            RacePlayerStatus playerStatus, RaceStatus raceStatus, ErrorCode expected) {
        Long id = openOffer();
        terminalState(playerStatus, raceStatus);
        error(expected, () -> choiceService.choose(secondRequest, new StudentChallengeChoiceRequest(id, "SAFE_RUN")));
        assertEquals(ChallengeOfferStatus.CANCELLED, offer(id).getStatus());
        assertNull(offer(id).getChoice());
        assertEquals(0, energy());
    }

    private void terminalState(RacePlayerStatus playerStatus, RaceStatus raceStatus) {
        transactions.executeWithoutResult(status -> {
            locked().setStatus(playerStatus);
            raceRepository.findById(raceId).orElseThrow().setStatus(raceStatus);
        });
    }

    @Test
    void conflictingReplayUsesDedicatedConflict() {
        Long id = openOffer();
        choiceService.choose(secondRequest, new StudentChallengeChoiceRequest(id, "TURBO_TRIAL"));
        error(ErrorCode.CHALLENGE_CHOICE_CONFLICT, () -> choiceService.choose(secondRequest,
                new StudentChallengeChoiceRequest(id, "SAFE_RUN")));
        assertEquals(ChallengeChoice.TURBO_TRIAL, offer(id).getChoice());
    }

    @Test
    void nonexistentAndForeignOfferAreHidden() {
        Long id = openOffer();
        error(ErrorCode.CHALLENGE_OFFER_NOT_FOUND, () -> choiceService.choose(secondRequest,
                new StudentChallengeChoiceRequest(Long.MAX_VALUE, "SAFE_RUN")));
        transactions.executeWithoutResult(status -> offerRepository.findById(id)
                .orElseThrow().setRacePlayer(playerRepository.findById(firstId).orElseThrow()));
        error(ErrorCode.CHALLENGE_OFFER_NOT_FOUND, () -> choiceService.choose(secondRequest,
                new StudentChallengeChoiceRequest(id, "SAFE_RUN")));
    }

    @Test
    void exactExpiryRejectsSelectionAfterCommittingExpiry() {
        Long id = openOffer();
        clock.set(T + 12_000);
        error(ErrorCode.CHALLENGE_OFFER_EXPIRED, () -> choiceService.choose(secondRequest,
                new StudentChallengeChoiceRequest(id, "SAFE_RUN")));
        assertEquals(ChallengeOfferStatus.EXPIRED, offer(id).getStatus());
        assertEquals(50, energy());
        error(ErrorCode.CHALLENGE_OFFER_EXPIRED, () -> choiceService.choose(secondRequest,
                new StudentChallengeChoiceRequest(id, "SAFE_RUN")));
    }

    @ParameterizedTest
    @ValueSource(strings = {"", " ", "NORMAL", "CHALLENGE_CHOICE", "LUCK", "turbo_trial", "BOOST"})
    void invalidChoiceUsesApprovedApplicationError(String choice) {
        error(ErrorCode.INVALID_CHALLENGE_CHOICE, () -> choiceService.choose(secondRequest,
                new StudentChallengeChoiceRequest(17L, choice)));
    }

    @Test
    void nullChoiceUsesApprovedApplicationError() {
        error(ErrorCode.INVALID_CHALLENGE_CHOICE, () -> choiceService.choose(secondRequest,
                new StudentChallengeChoiceRequest(17L, null)));
    }

    @Test
    void activeOfferBlocksNormalGenerationAndReturnsSpecificError() {
        openOffer();
        error(ErrorCode.CHALLENGE_CHOICE_REQUIRED, () -> questions.getOrCreateCurrentQuestion(second()));
        verifyNoInteractions(plans, generation);
        assertTrue(transactions.<Boolean>execute(status -> questionRepository
                .findFirstByRacePlayerAndStatusOrderByCreatedAtDesc(locked(), PlayerQuestionStatus.ACTIVE).isEmpty()));
    }

    @ParameterizedTest
    @EnumSource(ChallengeChoice.class)
    void selectedStateCannotGenerateNormalQuestion(ChallengeChoice choice) {
        Long id = openOffer();
        choiceService.choose(secondRequest, new StudentChallengeChoiceRequest(id, choice.name()));
        allowGeneration();
        assertEquals(QuestionGameplayContext.valueOf(choice.name()),
                questions.getOrCreateCurrentQuestion(second()).getGameplayContext());
        verifyNoInteractions(plans);
    }

    @Test
    void expiredOfferSettlesThenDeliversPersistedNormalQuestion() {
        Long id = openOffer();
        allowGeneration();
        clock.set(T + 14_000);
        var response = questions.getOrCreateCurrentQuestion(second());
        assertEquals(QuestionGameplayContext.NORMAL, response.getGameplayContext());
        assertEquals(50, energy());
        assertEquals(ChallengeOfferStatus.EXPIRED, offer(id).getStatus());
        assertEquals(1, snapshot().getGameplay().activeEffects().size());
        assertEquals(PlayerQuestionStatus.ACTIVE, transactions.execute(status -> questionRepository
                .findById(response.getQuestionId()).orElseThrow().getStatus()));
    }

    @Test
    void rollbackSelectionLeavesActiveOfferUnchanged() {
        Long id = openOffer();
        transactions.executeWithoutResult(status -> {
            choiceService.choose(secondRequest, new StudentChallengeChoiceRequest(id, "SAFE_RUN"));
            status.setRollbackOnly();
        });
        assertEquals(ChallengeOfferStatus.ACTIVE, offer(id).getStatus());
        assertNull(offer(id).getChoice());
        assertNull(offer(id).getResolvedAtEpochMs());
    }

    @Test
    void exactPublicFieldsAndChoicesHaveNoInternalLeak() throws Exception {
        Long id = openOffer();
        var mapper = new ObjectMapper();
        JsonNode gameplay = mapper.valueToTree(snapshot().getGameplay());
        assertEquals(Set.of("mode", "effectiveSpeed", "activeEffects", "challenge"), names(gameplay));
        assertEquals(Set.of("energy", "threshold", "offer", "run", "lastResult"), names(gameplay.get("challenge")));
        assertEquals(100, gameplay.get("challenge").get("threshold").asInt());
        var offer = gameplay.get("challenge").get("offer");
        assertEquals(Set.of("offerId", "expiresAtEpochMs", "choices"), names(offer));
        assertEquals(List.of("TURBO_TRIAL", "SAFE_RUN"), mapper.convertValue(offer.get("choices"), List.class));
        var response = mapper.valueToTree(choiceService.choose(secondRequest,
                new StudentChallengeChoiceRequest(id, "SAFE_RUN")));
        assertEquals(Set.of("offerId", "choice", "selectedAtEpochMs", "snapshot"), names(response));
        assertTrue(response.get("snapshot").get("gameplay").get("challenge").get("offer").isNull());
        assertEquals(Set.of("offerId", "choice"), names(mapper.valueToTree(
                new StudentChallengeChoiceRequest(id, "SAFE_RUN"))));
    }

    private Set<String> names(JsonNode node) {
        var result = new HashSet<String>();
        node.fieldNames().forEachRemaining(result::add);
        return result;
    }

    private void error(ErrorCode code, Runnable action) {
        assertEquals(code, assertThrows(ApiException.class, action::run).getErrorCode());
    }
}
