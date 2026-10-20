-- DRAFT ONLY: not installed, versioned, or approved for target execution.
-- Non-repeatable expansion. Use the guarded disposable runner for rehearsal only.
-- STOP if preflight reports any of these ten columns or either new table.
-- MySQL DDL commits independently. No transaction rollback is promised.
SET SESSION lock_wait_timeout = 5;
ALTER TABLE race_player_gameplay_states
  ADD COLUMN guard_shield_charges INT NOT NULL DEFAULT 0,
  ADD COLUMN guard_shield_granted BIT(1) NOT NULL DEFAULT b'0',
  ADD COLUMN guard_shield_award_question_id BIGINT NULL,
  ADD COLUMN luck_rolls_taken INT NOT NULL DEFAULT 0,
  ADD COLUMN luck_events_received INT NOT NULL DEFAULT 0,
  ADD COLUMN next_luck_roll_not_before_epoch_ms BIGINT NULL,
  ADD COLUMN last_luck_roll_sequence BIGINT NULL,
  ADD COLUMN last_luck_received_sequence BIGINT NULL,
  ADD COLUMN last_accepted_manual_normal_answer_at_epoch_ms BIGINT NULL,
  ADD COLUMN last_luck_was_negative BIT(1) NOT NULL DEFAULT b'0',
  ADD CONSTRAINT chk_s404_gameplay_bounds CHECK
    (challenge_energy BETWEEN 0 AND 100 AND guard_shield_charges BETWEEN 0 AND 1
     AND luck_events_received BETWEEN 0 AND 2 AND luck_rolls_taken >= 0);

CREATE TABLE `race_luck_fairness_states` (
  `created_at` datetime(6) NOT NULL,
  `decision_sequence` bigint NOT NULL DEFAULT '0',
  `id` bigint NOT NULL AUTO_INCREMENT,
  `last_event_recipient_player_id` bigint DEFAULT NULL,
  `last_event_sequence` bigint DEFAULT NULL,
  `race_id` bigint NOT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKh1tuy0gdbfqg0nbvam2hjudj0` (`race_id`),
  KEY `FK1valij9y0ft8ennlp6qetfmft` (`last_event_recipient_player_id`),
  CONSTRAINT `FK1valij9y0ft8ennlp6qetfmft` FOREIGN KEY (`last_event_recipient_player_id`) REFERENCES `race_players` (`id`),
  CONSTRAINT `FK69wjhhlt2mvw2tbba7h9g2nrn` FOREIGN KEY (`race_id`) REFERENCES `races` (`id`),
  CONSTRAINT `race_luck_fairness_states_chk_1` CHECK ((`decision_sequence` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `race_player_luck_decisions` (
  `effective_magnitude_or_energy_delta` double DEFAULT NULL,
  `created_at` datetime(6) NOT NULL,
  `decided_at_epoch_ms` bigint NOT NULL,
  `decision_sequence` bigint NOT NULL,
  `id` bigint NOT NULL AUTO_INCREMENT,
  `race_player_id` bigint NOT NULL,
  `source_question_id` bigint NOT NULL,
  `speed_effect_id` bigint DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `applied_type` enum('ENERGY_ORB','MUD_SPLASH','TAILWIND') DEFAULT NULL,
  `outcome` enum('APPLIED','BLOCKED_BY_SHIELD','NO_EFFECT','NO_EVENT') NOT NULL,
  `selected_type` enum('ENERGY_ORB','MUD_SPLASH','TAILWIND') DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_luck_player_question` (`race_player_id`,`source_question_id`),
  KEY `idx_luck_player_sequence` (`race_player_id`,`decision_sequence`),
  KEY `idx_luck_player_event` (`race_player_id`,`id` DESC),
  KEY `FK84ojhxr8gy5ysyqfr6seq5ixe` (`source_question_id`),
  KEY `FKkk3u0xvji6l3mi57aalib0ixj` (`speed_effect_id`),
  CONSTRAINT `FK84ojhxr8gy5ysyqfr6seq5ixe` FOREIGN KEY (`source_question_id`) REFERENCES `player_questions` (`id`),
  CONSTRAINT `FK8k1p36r42vlhcxlqe1qrtuq3f` FOREIGN KEY (`race_player_id`) REFERENCES `race_players` (`id`),
  CONSTRAINT `FKkk3u0xvji6l3mi57aalib0ixj` FOREIGN KEY (`speed_effect_id`) REFERENCES `race_player_speed_effects` (`id`),
  CONSTRAINT `race_player_luck_decisions_chk_1` CHECK (((`decision_sequence` > 0) and (((`outcome` = _utf8mb4'NO_EVENT') and (`selected_type` is null) and (`applied_type` is null)) or ((`outcome` = _utf8mb4'NO_EFFECT') and (`selected_type` is not null) and (`applied_type` is null)) or ((`outcome` = _utf8mb4'APPLIED') and (`selected_type` is not null) and (`applied_type` is not null)) or ((`outcome` = _utf8mb4'BLOCKED_BY_SHIELD') and (`selected_type` is not null) and (`applied_type` is not null) and (`selected_type` = _utf8mb4'MUD_SPLASH') and (`applied_type` = _utf8mb4'MUD_SPLASH')))))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
