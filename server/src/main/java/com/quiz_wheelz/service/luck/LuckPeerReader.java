package com.quiz_wheelz.service.luck;

import lombok.RequiredArgsConstructor;
import com.quiz_wheelz.common.LuckRules;
import org.springframework.dao.DataAccessResourceFailureException;
import org.springframework.stereotype.Service;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class LuckPeerReader {
    private final LuckPeerJdbcResources resources;

    public List<RaceLuckFairnessPolicy.Candidate> readCommittedPeers(long raceId, long selfId, long instant) {
        try (var connection = resources.connection();
             var statement = connection.prepareStatement("""

                select p.id, s.luck_events_received, s.last_luck_roll_sequence,
                       s.last_accepted_manual_normal_answer_at_epoch_ms
                from race_players p
                join races r on r.id = p.race_id
                join race_player_gameplay_states s on s.race_player_id = p.id
                where p.race_id = ? and p.id <> ? and p.status = 'RACING'
                  and r.status = 'IN_PROGRESS' and p.position < r.total_distance * 0.80
                  and s.luck_events_received < 2
                  and s.last_accepted_manual_normal_answer_at_epoch_ms between ? and ?
                  and (s.next_luck_roll_not_before_epoch_ms is null or s.next_luck_roll_not_before_epoch_ms <= ?)
                  and not exists (select 1 from race_player_challenge_offers o where o.race_player_id = p.id
                    and (o.status = 'ACTIVE' or (o.status = 'SELECTED' and o.execution_ended_at_epoch_ms is null)))
                  and not exists (select 1 from race_player_speed_effects e where e.race_player_id = p.id
                    and e.type in ('SPEED_SLOW','SPEED_BOOST') and e.starts_at_epoch_ms <= ? and e.ends_at_epoch_ms > ?)
                order by p.id
                                """)) {
            statement.setQueryTimeout(resources.queryTimeoutSeconds());
            statement.setLong(1, raceId);
            statement.setLong(2, selfId);
            statement.setLong(3, instant - LuckRules.PROVISIONAL_ACTIVITY_WINDOW_MS);
            statement.setLong(4, instant);
            statement.setLong(5, instant);
            statement.setLong(6, instant);
            statement.setLong(7, instant);
            var result = new ArrayList<RaceLuckFairnessPolicy.Candidate>();
            try (var rows = statement.executeQuery()) {
                while (rows.next()) result.add(new RaceLuckFairnessPolicy.Candidate(rows.getLong(1), rows.getInt(2),
                        rows.getObject(3, Long.class), rows.getObject(4, Long.class), true));
            }
            return List.copyOf(result);
        } catch (SQLException error) {
            throw new DataAccessResourceFailureException("Luck peer read failed", error);
        }
    }
}
