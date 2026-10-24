package com.quiz_wheelz.service.raceplayer;

import com.quiz_wheelz.common.LuckRules;
import com.quiz_wheelz.entitys.RacePlayerFocusEvent;
import com.quiz_wheelz.enums.RacePlayerFocusEventOutcome;
import com.quiz_wheelz.enums.RacePlayerFocusEventType;
import com.quiz_wheelz.service.question.PlayerQuestionCleanupService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Import;

import javax.sql.DataSource;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.TreeSet;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@Import(PlayerQuestionCleanupService.class)
class PlayerQuestionCleanupIntegrationTest extends B1LuckIntegrationFixture {
    @Autowired PlayerQuestionCleanupService cleanup;
    @Autowired DataSource dataSource;

    @Test
    void cleanupKeepsQuestionsThatLuckOrFocusHistoryReferencesAndDeletesTheRest() {
        submit(true);
        Long luckOnly = questionId;
        nextQuestion(T);
        submit(true);
        Long unreferenced = questionId;
        nextQuestion(T);
        submit(true);
        Long focusOnly = questionId;
        focusEvent(focusOnly);
        nextQuestion(T + LuckRules.COOLDOWN_MS);
        submit(true);
        Long both = questionId;
        focusEvent(both);
        assertEquals(List.of(luckOnly, both),
                history().stream().map(decision -> decision.getSourceQuestion().getId()).toList());
        olderThanRetention(List.of(luckOnly, unreferenced, focusOnly, both));

        assertEquals(1, cleanup.cleanupOldInactiveQuestions());

        for (Long kept : List.of(luckOnly, focusOnly, both)) {
            assertTrue(questionRepository.existsById(kept));
        }
        assertFalse(questionRepository.existsById(unreferenced));
        assertEquals(2, history().size());
        assertEquals(2L, focusEventCount());
    }

    @Test
    void cleanupCoversEveryTableThatReferencesPlayerQuestions() throws Exception {
        var referencing = new TreeSet<String>();
        try (var connection = dataSource.getConnection();
             var keys = connection.getMetaData().getExportedKeys(null, null, "player_questions")) {
            while (keys.next()) {
                referencing.add(keys.getString("FKTABLE_NAME").toLowerCase(Locale.ROOT));
            }
        }
        assertEquals(Set.of("player_question_choices", "race_player_focus_events", "race_player_luck_decisions"),
                referencing, "PlayerQuestionRepository.findCleanupCandidates must account for every reference");
    }

    private void focusEvent(Long playerQuestionId) {
        transactions.executeWithoutResult(status -> {
            var event = new RacePlayerFocusEvent();
            event.setRacePlayer(playerRepository.findById(secondId).orElseThrow());
            event.setClientEventId(UUID.randomUUID().toString());
            event.setType(RacePlayerFocusEventType.TAB_HIDDEN);
            event.setPlayerQuestion(questionRepository.findById(playerQuestionId).orElseThrow());
            event.setOutcome(RacePlayerFocusEventOutcome.WARNING);
            event.setCountedFocusLoss(true);
            event.setFocusLossCountAfter(1);
            event.setQuestionFocusLossCountAfter(1);
            event.setRecordedAt(local(T));
            entityManager.persist(event);
        });
    }

    private void olderThanRetention(List<Long> playerQuestionIds) {
        transactions.executeWithoutResult(status -> entityManager.createNativeQuery(
                        "update player_questions set updated_at = :old where id in (:ids)")
                .setParameter("old", local(T).minusDays(30))
                .setParameter("ids", playerQuestionIds)
                .executeUpdate());
    }

    private long focusEventCount() {
        return transactions.execute(status -> entityManager
                .createQuery("select count(event) from RacePlayerFocusEvent event", Long.class)
                .getSingleResult());
    }
}
