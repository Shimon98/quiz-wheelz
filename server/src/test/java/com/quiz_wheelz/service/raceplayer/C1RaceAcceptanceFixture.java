package com.quiz_wheelz.service.raceplayer;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.quiz_wheelz.dto.answer.SubmitAnswerRequest;
import com.quiz_wheelz.dto.raceplayer.StudentRaceRuntimeSnapshotResponse;
import com.quiz_wheelz.entitys.*;
import com.quiz_wheelz.enums.*;
import com.quiz_wheelz.service.luck.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.util.ReflectionTestUtils;
import java.nio.file.*;
import java.time.Instant;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

abstract class C1RaceAcceptanceFixture extends B1LuckIntegrationFixture {
    @Autowired AcceptedAnswerLuckService integration;
    final Map<Long, Long> activity = new HashMap<>();
    final List<Map<String, Object>> trace = new ArrayList<>();
    final Set<Long> deferred = new HashSet<>();

    void observe() {
        when(redisPresenceService.findLastGameplayActivityAt(anyLong(), anyLong())).thenAnswer(call ->
                Optional.of(Instant.ofEpochMilli(activity.getOrDefault(call.getArgument(1), clock.millis()))));
        doAnswer(call -> {
            activity.put(call.getArgument(1), ((Instant) call.getArgument(2)).toEpochMilli());
            return null;
        }).when(redisPresenceService).recordGameplayActivity(anyLong(), anyLong(), any());
        doAnswer(call -> {
            @SuppressWarnings("unchecked")
            var candidates = (List<RaceLuckFairnessPolicy.Candidate>) call.callRealMethod();
            long id = call.getArgument(1);
            long instant = call.getArgument(2);
            var state = stateRepository.findByRacePlayerId(id).orElseThrow();
            var raceState = fairnessStates.findByRaceId(call.getArgument(0)).orElseThrow();
            var current = new RaceLuckFairnessPolicy.Candidate(id, state.getLuckEventsReceived(),
                    state.getLastLuckRollSequence(), instant, true);
            if (new RaceLuckFairnessPolicy().defer(current, candidates,
                    raceState.getLastEventRecipient() == null ? null : raceState.getLastEventRecipient().getId(),
                    raceState.getLastEventSequence(), instant, 60000)) deferred.add(id);
            return candidates;
        }).when(peers).readCommittedPeers(anyLong(), anyLong(), anyLong());
    }

    List<Long> newRace(int count, int length) {
        return transactions.execute(status -> {
            var original = raceRepository.findById(raceId).orElseThrow();
            var race = new Race();
            race.setTeacher(original.getTeacher());
            race.setSubject(original.getSubject());
            race.setRoomCode(UUID.randomUUID().toString().substring(0, 6));
            race.setTitle("C1 acceptance");
            race.setTotalDistance(length);
            race.setMaxPlayers(8);
            race.setStatus(RaceStatus.IN_PROGRESS);
            race.setStartedAt(local(clock.millis()));
            entityManager.persist(race);
            var ids = new ArrayList<Long>();
            for (int index = 0; index < count; index++) {
                var player = player(race, "C1-" + index, index + 1, 0.0);
                player.setMovementUpdatedAtEpochMs(clock.millis());
                player.setLastSeenAt(local(clock.millis()));
                player.setSpeed(new double[]{.5, 1, 1.9, 2}[index % 4]);
                entityManager.persist(player);
                stateService.createInitialState(player);
                ids.add(player.getId());
            }
            raceId = race.getId();
            return List.copyOf(ids);
        });
    }

    StudentRaceRuntimeSnapshotResponse get(long id) {
        return raceStates.getRaceState(session(id)).getSnapshot();
    }

    RacePlayer owner(long id) {
        var race = new Race();
        race.setId(raceId);
        var player = new RacePlayer();
        player.setId(id);
        player.setRace(race);
        return player;
    }

    SubmitAnswerRequest normalQuestion(long id, boolean correct) {
        return transactions.execute(status -> {
            var template = questionRepository.findById(questionId).orElseThrow().getQuestionTemplate();
            var question = new PlayerQuestion();
            question.setRacePlayer(playerRepository.findById(id).orElseThrow());
            question.setQuestionTemplate(template);
            question.setQuestionText("1 + 1");
            question.setCorrectAnswerValue(2);
            question.setTimeLimitSeconds(30);
            question.setExpiresAt(local(clock.millis() + 30000));
            entityManager.persist(question);
            Long choiceId = null;
            for (int index = 0; index < 2; index++) {
                var choice = new PlayerQuestionChoice();
                choice.setPlayerQuestion(question);
                choice.setChoiceText(index == 0 ? "2" : "3");
                choice.setAnswerValue(index == 0 ? 2 : 3);
                choice.setCorrect(index == 0);
                choice.setDisplayOrder(index + 1);
                entityManager.persist(choice);
                if (choice.isCorrect() == correct) choiceId = choice.getId();
            }
            var request = new SubmitAnswerRequest();
            request.setQuestionId(question.getId());
            request.setChoiceId(choiceId);
            return request;
        });
    }

    StudentRaceRuntimeSnapshotResponse accept(long id, boolean correct, int round, boolean enabled) {
        var before = get(id);
        var old = transactions.execute(status -> stateRepository.findByRacePlayerId(id).orElseThrow());
        var request = normalQuestion(id, correct);
        deferred.remove(id);
        var response = answerService.submitAnswer(owner(id), request);
        var after = response.getRaceImpact().getSnapshot();
        assertEquals(correct, response.isCorrect());
        int scoreDelta = !correct ? 0 : switch (before.getCurrentDifficulty()) {
            case EASY -> 10;
            case MEDIUM -> 15;
            case HARD -> 20;
        };
        assertEquals(before.getScore() + scoreDelta, after.getScore());
        assertTrue(after.getPosition() >= before.getPosition());
        assertTrue(after.getGameplay().effectiveSpeed() <= 2.0);
        var state = transactions.execute(status -> stateRepository.findByRacePlayerId(id).orElseThrow());
        var history = transactions.execute(status -> decisions.findByRacePlayerIdOrderByDecisionSequenceAsc(id));
        String reason = "INELIGIBLE";
        if (state.getLuckRollsTaken() > old.getLuckRollsTaken()) reason = history.getLast().getOutcome().name();
        else if (deferred.contains(id)) reason = "FAIRNESS_DEFERRED";
        else if (!old.getGuardShieldGranted() && state.getGuardShieldGranted()) reason = "SHIELD";
        else if (after.isPlayerFinished()) reason = "TERMINAL";
        else if (after.getPosition() >= after.getTotalDistance() * .8) reason = "GATE";
        else if (after.getGameplay().challenge().offer() != null) reason = "CHALLENGE";
        else if (!before.getGameplay().activeEffects().isEmpty()) reason = "ACTIVE_EFFECT";
        else if (old.getLuckEventsReceived() >= 2) reason = "CAP";
        else if (old.getNextLuckRollNotBeforeEpochMs() != null
                && clock.millis() < old.getNextLuckRollNotBeforeEpochMs()) reason = "COOLDOWN";
        if (!enabled) reason = "OFF";
        var row = new LinkedHashMap<String, Object>();
        row.put("player", id);
        row.put("round", round);
        row.put("at", clock.millis());
        row.put("correct", correct);
        row.put("reason", reason);
        row.put("rolls", state.getLuckRollsTaken());
        row.put("events", state.getLuckEventsReceived());
        row.put("energy", state.getChallengeEnergy());
        row.put("shield", state.getGuardShieldCharges());
        row.put("awardQuestionId", state.getGuardShieldAwardQuestionId());
        row.put("nextRollNotBefore", state.getNextLuckRollNotBeforeEpochMs());
        row.put("position", after.getPosition());
        row.put("score", after.getScore());
        row.put("difficulty", after.getCurrentDifficulty());
        row.put("finished", after.isPlayerFinished());
        row.put("audit", history.stream().map(item -> Arrays.asList(item.getDecisionSequence(),
                item.getSelectedType(), item.getAppliedType(), item.getOutcome())).toList());
        trace.add(row);
        assertTrue(state.getLuckEventsReceived() <= 2);
        boolean negative = false;
        for (var item : history) {
            if (item.getOutcome() == LuckOutcome.APPLIED || item.getOutcome() == LuckOutcome.BLOCKED_BY_SHIELD) {
                assertFalse(negative && item.getAppliedType() == LuckEventType.MUD_SPLASH);
                negative = item.getAppliedType() == LuckEventType.MUD_SPLASH;
            }
        }
        return after;
    }

    void enabled(boolean value) {
        Object target = org.springframework.test.util.AopTestUtils.getUltimateTargetObject(integration);
        ReflectionTestUtils.setField(target, "enabled", value);
    }

    @org.junit.jupiter.api.AfterEach
    void restoreIsolatedTestFlag() {
        enabled(true);
    }

    void evidence(String name, Object value) throws Exception {
        Files.createDirectories(Path.of("target", "c1-evidence"));
        String dialect = entityManager.getEntityManagerFactory().unwrap(org.hibernate.engine.spi.SessionFactoryImplementor.class)
                .getJdbcServices().getDialect().getClass().getSimpleName();
        Files.writeString(Path.of("target", "c1-evidence", name + "-" + dialect + ".json"),
                new ObjectMapper().findAndRegisterModules().writerWithDefaultPrettyPrinter().writeValueAsString(value));
    }
}
