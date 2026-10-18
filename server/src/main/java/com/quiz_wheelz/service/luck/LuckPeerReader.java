package com.quiz_wheelz.service.luck;

import lombok.RequiredArgsConstructor;
import com.quiz_wheelz.common.LuckRules;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@RequiredArgsConstructor
public class LuckPeerReader {
    private final JdbcTemplate jdbc;

    @Transactional(propagation = Propagation.REQUIRES_NEW, isolation = Isolation.READ_COMMITTED, readOnly = true)
    public List<RaceLuckFairnessPolicy.Candidate> readCommittedPeers(long raceId, long selfId, long instant) {
        return jdbc.query("""
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
                """, (row, index) -> new RaceLuckFairnessPolicy.Candidate(
                row.getLong(1), row.getInt(2), row.getObject(3, Long.class), row.getObject(4, Long.class), true),
                raceId, selfId, instant - LuckRules.PROVISIONAL_ACTIVITY_WINDOW_MS, instant, instant, instant, instant);
    }
}
