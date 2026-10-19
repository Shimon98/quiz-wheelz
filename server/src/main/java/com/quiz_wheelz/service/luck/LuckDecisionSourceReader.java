package com.quiz_wheelz.service.luck;

import com.quiz_wheelz.repository.RacePlayerLuckDecisionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataAccessResourceFailureException;
import org.springframework.stereotype.Service;
import java.sql.SQLException;

@Service
@RequiredArgsConstructor
public class LuckDecisionSourceReader {
    private final RacePlayerLuckDecisionRepository decisions;
    private final LuckPeerJdbcResources resources;

    public boolean alreadyRecorded(long playerId, long questionId) {
        decisions.flush();
        if (decisions.existsByRacePlayerIdAndSourceQuestionId(playerId, questionId)) return true;
        try (var connection = resources.connection();
             var statement = connection.prepareStatement("""
                     select 1 from race_player_luck_decisions
                     where race_player_id = ? and source_question_id = ?
                     """)) {
            statement.setQueryTimeout(resources.queryTimeoutSeconds());
            statement.setLong(1, playerId);
            statement.setLong(2, questionId);
            try (var rows = statement.executeQuery()) {
                return rows.next();
            }
        } catch (SQLException error) {
            throw new DataAccessResourceFailureException("Luck source read failed", error);
        }
    }
}
