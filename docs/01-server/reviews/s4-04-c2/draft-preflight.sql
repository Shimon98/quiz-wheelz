-- DRAFT ONLY, read-only inventory. The runner must interpret and enforce results.
SELECT DATABASE(), VERSION(), @@transaction_isolation, @@max_connections;
SELECT table_name FROM information_schema.tables
 WHERE table_schema=DATABASE() ORDER BY table_name;
SELECT table_name,column_name,column_type,is_nullable,column_default
 FROM information_schema.columns WHERE table_schema=DATABASE()
 AND table_name IN ('race_player_gameplay_states','race_luck_fairness_states','race_player_luck_decisions')
 ORDER BY table_name,ordinal_position;
SELECT * FROM information_schema.statistics WHERE table_schema=DATABASE()
 AND table_name IN ('race_player_gameplay_states','race_luck_fairness_states','race_player_luck_decisions');
SELECT * FROM information_schema.table_constraints WHERE constraint_schema=DATABASE();
SELECT * FROM information_schema.check_constraints WHERE constraint_schema=DATABASE();
SELECT COUNT(*) AS invalid_energy FROM race_player_gameplay_states
 WHERE challenge_energy IS NULL OR challenge_energy NOT BETWEEN 0 AND 100;
SELECT COUNT(*) AS gameplay_rows,MIN(id),MAX(id),SUM(challenge_energy) FROM race_player_gameplay_states;
