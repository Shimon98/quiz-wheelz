# S4-04 C2 — schema migration proposal (DRAFT ONLY)

This package proposes and rehearses expansion SQL; it installs no migration chain.
`MIGRATION_POLICY_UNDECIDED`: the canonical roadmap reserves migrations for Phase 6;
server rules require migrations/validate, but designate neither a framework nor an
operational schema-change authority. Diana owns the server review; the authorized
target database operator, change procedure, version ledger and restore owner remain
to be assigned explicitly. No Flyway/Liquibase dependency is selected or installed.

## Authoritative baseline and mapping delta

Pre-Luck main: `84a44230b77f6acb469c6f969070e4c0cf409325`. Current mapping:
`733cbb16be508b63ce4fe6a9108923cde9d8ce1b`. Sources are BaseEntity,
RacePlayerGameplayState, RaceLuckFairnessState, RacePlayerLuckDecision and their
Luck enums under `server/src/main/java/com/quiz_wheelz/`. Their exact identities,
all other app/test/client identities and relevant config are in
`server/target/c2-evidence/baseline-identity.json`. C1's captured MySQL DDL was
cross-checked with the entity delta; fresh rehearsal DDL is retained separately.

`draft-expansion.sql` adds exactly these ten fields to the existing gameplay table:

| Column | MySQL type | Null | Default |
|---|---|---|---|
| guard_shield_charges | INT | no | 0 |
| guard_shield_granted | BIT(1) | no | b'0' |
| guard_shield_award_question_id | BIGINT | yes | NULL |
| luck_rolls_taken | INT | no | 0 |
| luck_events_received | INT | no | 0 |
| next_luck_roll_not_before_epoch_ms | BIGINT | yes | NULL |
| last_luck_roll_sequence | BIGINT | yes | NULL |
| last_luck_received_sequence | BIGINT | yes | NULL |
| last_accepted_manual_normal_answer_at_epoch_ms | BIGINT | yes | NULL |
| last_luck_was_negative | BIT(1) | no | b'0' |

No existing column, timestamp, PK, FK, uniqueness or Challenge predicate is dropped
or rewritten. `challenge_energy INT NOT NULL DEFAULT 0` and existing 0..100 CHECKs
remain. Added `chk_s404_gameplay_bounds` enforces Energy 0..100, charges 0..1,
events 0..2 and rolls >=0. It includes bounds represented by bean-generated checks
in fresh Hibernate DDL. Award-question ID is deliberately a nullable scalar with
no FK in the approved mapping; this proposal does not invent one.

Both new tables use InnoDB/utf8mb4/utf8mb4_0900_ai_ci and the approved BaseEntity
fields: `id BIGINT AUTO_INCREMENT PRIMARY KEY`, `created_at DATETIME(6) NOT NULL`,
`updated_at DATETIME(6) NULL`, with no database timestamp default.

| Table | Additional fields and enforcement |
|---|---|
| race_luck_fairness_states | race_id BIGINT NOT NULL, unique FK to races(id); decision_sequence BIGINT NOT NULL DEFAULT 0 CHECK >=0; last_event_recipient_player_id BIGINT NULL FK to race_players(id), with supporting index; last_event_sequence BIGINT NULL |
| race_player_luck_decisions | race_player_id/source_question_id BIGINT NOT NULL FKs to race_players/player_questions; decision_sequence/decided_at_epoch_ms BIGINT NOT NULL; selected_type/applied_type nullable native ENUM('ENERGY_ORB','MUD_SPLASH','TAILWIND'); outcome NOT NULL native ENUM('APPLIED','BLOCKED_BY_SHIELD','NO_EFFECT','NO_EVENT'); effective_magnitude_or_energy_delta DOUBLE NULL; speed_effect_id BIGINT NULL FK to race_player_speed_effects(id) |

Audit indexes: named UNIQUE `uk_luck_player_question(race_player_id,source_question_id)`;
`idx_luck_player_sequence(race_player_id,decision_sequence)` (not unique);
`idx_luck_player_event(race_player_id,id DESC)`; supporting question/effect FK indexes.
All FK delete/update actions retain default NO ACTION/RESTRICT semantics. The exact
definitions/names are in the draft SQL and `migrated-*.txt` SHOW CREATE evidence.

The audit CHECK requires sequence >0 and the approved four alternatives: NO_EVENT
has both types null; NO_EFFECT selected nonnull/applied null; APPLIED both nonnull;
BLOCKED_BY_SHIELD both exactly MUD_SPLASH. No stronger inferred relation between
magnitude, ownership, last-event sequence and type is introduced. Application owners
retain those semantics. Native ENUM order is preserved, including sorted Hibernate
enum values. Generated FK/unique/check names are distinguished from semantic
compatibility; the draft reuses captured names for new tables and gives the new
combined gameplay CHECK an explicit proposal name. Real validate startup establishes
the tested mapping compatibility; validate alone is not a full CHECK/index audit.

## Existing-data rehearsal (synthetic only)

An archive of local main was exported to ignored `server/target/c2-evidence/main-baseline`
without checkout/ref edits. Java 21/Maven built that exact server. Its application
generated the real pre-Luck schema in `c2_pre_luck` with `ddl-auto=create` solely to
construct the disposable baseline. This use of create is not called migration success.
The synthetic baseline was dumped once and restored into `c2_migrated` and `c2_partial`.
No target backup was taken. The dump is synthetic and accompanies the evidence.

Baseline: 12 tables, one Race, eight RacePlayers, eight persisted ANSWERED NORMAL
questions, eight gameplay rows with Energy 0/20/25/30/50/75/99/100, and two historical
Challenge offers (expired and completed Turbo). Other synthetic seed rows are included.
Every old column of every old row was snapshotted in PK order, including original IDs,
timestamps, FK values, question and Challenge data. Exact before/after equality passed.

On `c2_migrated`, only draft expansion DDL was applied. All ten new fields had the
expected existing-row defaults/nulls. Four valid audit outcomes were inserted; 23
negative tests asserted exact MySQL errors for uniqueness, FKs, native ENUM values,
non-null state, all bounds and audit outcome/type/sequence consistency. SHOW CREATE,
information_schema columns/statistics/table_constraints/check_constraints were captured.
The descending audit index is verified in metadata, independently of Hibernate validate.

Current compiled C1/B2 Spring Boot application (real app configuration and seeders,
test profile, Redis/Compose disabled, loopback ephemeral HTTP port) runs with
`ddl-auto=validate` against `c2_migrated`; startup and clean context close exit 0.
Restart on that same schema also exits 0. The previous main mapping validates the
expanded schema and exits 0, a limited old-mapping compatibility proof, not a full
rollback/application coexistence guarantee. Dependency libraries are from the isolated
main build, whose pom is identical to current; current target/classes are independently
hashed. The tiny ignored C2StartupProbe only launches/observes/closes the real app.

Negative controls with the same current app and Luck OFF exit 1 on missing
`race_luck_fairness_states` in both unmigrated and partially migrated disposable DBs.
Expected schema errors are retained. OFF does not bypass JPA validation.

## Failures, locking, re-execution and recovery proposal

Read-only `draft-preflight.sql` is inventory, not an autonomous safety gate. The
disposable runner additionally requires exact allowlisted DB names, known clean
baseline columns and no pre-existing Luck column/table before it applies SQL.
Both a fully applied expansion and the partial installation are refused for repeat
execution. No version ledger is installed. Before target execution, policy must
approve a ledger/version/checksum and baseline fingerprint; shape checks alone must
not silently label an unknown prior installation as the approved migration.

A controlled partial run executed BEGIN, the expansion ALTER, a deliberately invalid
CREATE referencing a missing parent, then a planned ROLLBACK. MySQL returned 1824,
but the successful ALTER persisted after the batch client aborted before its planned
ROLLBACK. A second fresh synthetic clone c2_partial_rollback used mysql --force only
for this intentional-error control: marker output proves ROLLBACK actually executed
after error 1824, and the earlier ALTER still persisted. Client --force can return 0
while printing an SQL error, so assertions require both the error and the post-rollback
marker; this is never used to call failed migration DDL successful. Original rows
still compare equal and rerun is refused. DDL is not script-atomic.
The runner detected ten columns with neither new table and refused resumption.
Original data remained unchanged. The partial database is deliberately not repaired.

A real concurrent transaction on a synthetic gameplay row held its metadata lock.
An ALTER with session lock_wait_timeout=1 returned expected 1205 and added no probe
column. This demonstrates a bounded failure, not lock-free or online migration.
The draft sets lock_wait_timeout=5; this controls metadata-lock acquisition, not
total ALTER execution duration or a production maintenance-window guarantee.

Target procedure proposal: authorized inventory and bad-row checks -> policy/version
approval -> operator-approved backup plus tested restore and recovery objectives ->
quiesce gameplay writers/jobs and drain transactions -> bounded expansion -> full
metadata/data assertions -> current app validate startup with Luck OFF -> release
readiness checks. No online ALTER algorithm or zero-downtime compatibility is assumed.
Actual version, table sizes, collations, partial history, replication, SQL mode and
privileges must be inspected under separate target authorization first.

On target failure, hold deployment/activation, retain error and actual metadata,
compare applied steps and checksum, and request an explicitly reviewed forward repair
or authorized restore. Do not rerun the whole file, add IF NOT EXISTS to hide drift,
drop populated new tables, remove columns or disable foreign_key_checks to force success.
Application rollback with schema left expanded requires separate operational approval;
the main-mapping startup proof is narrow, and rollback after Luck writes needs a data plan.

The metadata assertion helper additionally verified exact default/type/nullability,
native enum order, the descending composite index, all six relevant FKs and enforced
CHECKs from information_schema. Original row equality was checked again after startup.

**Synthetic baseline rehearsal passed; actual DEV/staging/production compatibility UNKNOWN.**
No live inventory, backup, DDL, migration framework adoption or release was performed.
Reproduction and cleanup are in the ignored evidence `REPRODUCE_EN.md` and scripts.
