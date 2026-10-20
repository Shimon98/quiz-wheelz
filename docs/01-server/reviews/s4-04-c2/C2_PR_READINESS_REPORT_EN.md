# S4-04 C2 — server PR readiness review

This is a local review package, not a PR or release approval. Branch remains
feature/s4-04-fair-luck at 733cbb16be508b63ce4fe6a9108923cde9d8ce1b, parent
ac67bc277fd8bcc7de7e86311aefee1f621b5a13. Initial index/worktree were empty.
Local main/origin-main and read-only observed remote main are
84a44230b77f6acb469c6f969070e4c0cf409325. Remote observation is timestamped in evidence,
not a permanent guarantee; main...HEAD divergence was 0/4. No fetch/ref change,
rebase, stage, commit, push, PR, merge or deployment occurred.

## Actual local regression

| Run | Total | Passed | Failures | Errors | Skipped | Exit | Seconds |
|---|---:|---:|---:|---:|---:|---:|---:|
| history-full-before-isolation | 1360 | 1357 | 1 | 0 | 2 | 1 | 1109.7 |
| security-isolated | 10 | 10 | 0 | 0 | 0 | 0 | 55.1 |
| security-shared-before | 20 | 20 | 0 | 0 | 0 | 0 | 27.8 |
| security-shared-after | 20 | 20 | 0 | 0 | 0 | 0 | 22.8 |
| history-arbitration-before-arbitration-guard | 2 | 0 | 2 | 0 | 0 | 1 | 11.7 |
| ordinary | 1250 | 1185 | 0 | 0 | 65 | 0 | 74.3 |
| focused | 491 | 489 | 0 | 0 | 2 | 0 | 427.6 |
| full | 1360 | 1358 | 0 | 0 | 2 | 0 | 450.1 |
| arbitration | 2 | 2 | 0 | 0 | 0 | 0 | 13.0 |

Final full run: 173 real MySQL Luck/B1/B2/C1 cases passed. Its two skipped cases
belong only to the separate legacy arbitration gate; their exact names are retained
in full-run.json. The separate arbitration result is not added to the full-run count.
Ordinary H2 verify reports 1250 total/1185 passed/65 skipped because all MySQL gates
are absent; disabled parameterized methods do not expand into the same number of
cases. gated-suite-counts.json compares per-suite counts directly with the Luck-enabled
full run, and ordinary-run.json retains every skipped name/reason.

Profile: test. Java 21.0.11 / Maven wrapper 3.9.16. Commands, raw source hashes,
HEAD, elapsed times, exit codes, exact XML suite counts and skipped case names are in
*-run.json and separate *-xml directories. Full/focused Luck runs use only the
disposable quizwheelz_s4_luck_test schema. The independent arbitration run uses
quizwheelz_c2_test. Ordinary run has both MySQL gates absent. A skip is not a pass.
C2 changes three existing test files only. StudentRaceLiveStreamSecurityTest gets a
dedicated H2 URL/context, retaining all ten cases, assertions, verifyNoInteractions and
the real scheduler. RaceChronologyIntegrationFixture delegates its unchanged default
Luck database verification through a test hook. RaceArbitrationMySqlTest overrides
only that database verification with its exact environment URL, the dedicated legacy
DB regex, MySQL product/dialect and RR assertions; its original isolation assertions,
URL gate and both concurrency test bodies remain. No production source changed and
no established assertion was weakened. Frozen C1 counts remain historical; current counts above are from new XML.

Startup/restart probes use ddl-auto=validate on the synthetically migrated schema;
they are separate from create-drop regression suites. SQL rehearsal assertions,
expected failure codes and schema snapshots are in the evidence package. Logs retain
expected rollback/constraint errors, initial Hibernate create/drop warnings and
development/sandbox helper failure history. Do not call all logs warning-free.

## Original full failure and test-only isolation

The first unchanged-source full run executed 1360 cases: 1357 passed, one failure,
zero errors and two skipped. The exact failure was
StudentRaceLiveStreamSecurityTest.validSessionUsesHeaderPrecedenceWithoutGameplayMutation,
Mockito NoInteractionsWanted at the presence mock, with calls from
RacePlayerGameplayPresenceService.resolve lines 57/62. Its log/XML are retained as
history-full-before-isolation*. The standalone ten-case suite passed, and the
20-case Challenge+SSE alphabetical slice also passed before the fix: the small slice
alone does not deterministically reproduce the full-order timing failure.

Source inspection shows identical default Spring/H2 configuration and presence mock
in these security fixtures; Challenge leaves RACING/IN_PROGRESS rows, while the SSE
fixture creates WAITING rows and asserts no presence interaction at all. The real
background scheduler can resolve leftover active players. The production SSE connect
path has no presence call. Test-data/context interference is the supported diagnosis,
not a proven production SSE mutation. A dedicated SSE H2 URL separates its context
and data without disabling scheduling, changing requests or weakening assertions.
The initial failure remains visible alongside all final results, not silently relabeled
as green. The first attempt to execute the independent legacy MySQL gate then failed twice
in fixture setup, before either arbitration scenario: its shared chronology fixture
called LuckDatabaseEvidence, whose MySQL URL guard correctly insists on the Luck test
DB, not quizwheelz_c2_test. This is a harness compatibility issue, not evidence of a
failed gameplay arbitration algorithm. The raw two failures are retained as
history-arbitration-before-arbitration-guard*. The test-only verification hook keeps
the default Luck verifier unchanged and adds a stricter explicit identity/dialect/RR
check for the legacy subclass. Both real-MySQL arbitration scenarios then pass.
Final source identities differ from C1 only in those three test files. All production
and client source, the Luck verifier itself and all established gameplay assertions
remain unchanged. Final full/focused/ordinary/arbitration runs record identical source
hash maps; previous green runs before the guard adjustment are retained as history.

## Integration risks and recommendations

Known overlapping integration owners: server plan/current-state documentation,
ARCHITECTURE_AND_CONTRACTS, student gameplay DTO/projection, answer/Challenge owners,
effect movement and repository state. Client mapping/synchronization paths are
Shimon's responsibility and unchanged. `branch-main.paths/stat` enumerate the entire
A/B1/B2/C1 branch delta; the C2-only patch/inventory are separate. No textual merge
rehearsal or hosted compatibility is claimed from the remote SHA observation.

C2 changes include review documentation, draft SQL and an unapplied CI example
under docs/01-server/reviews/s4-04-c2, the existing server plan and three focused test-fixture files (SSE H2 isolation and
legacy arbitration database identity). Generated
scripts, tiny nonproduction startup/YAML probes, source identities, synthetic dump,
JUnit XML/logs, SQL snapshots, manifest and complete patch live in ignored
server/target/c2-evidence. They add no application dependency or runtime behavior.
Complete relative file inventory is in final-verification.json and c2-working-tree.patch.

| Finding category | Outcome |
|---|---|
| Blocking code issue | None demonstrated in unchanged server code by this local gate; baseline startup/negative controls behaved as specified |
| Required migration-policy decision | MIGRATION_POLICY_UNDECIDED; choose owner/method/ledger/restore plan before any target DDL |
| Unknown target-environment facts | schema/history/version/data sizes/SQL mode/topology/permissions/backups and connection allocation remain UNKNOWN |
| Client responsibility | Shimon's contract mapping/rendering/expiry refresh and acceptance remain open |
| Nonblocking documentation suggestion | older checkpoint status paragraphs are historical; canonical C2 section and this gate register distinguish them |

Recommendation: C2 review-only patch is suitable for Diana's code/design review once
the listed local checks pass. A later explicitly authorized server PR can be reviewable
with open gates clearly recorded. Do not interpret this as authorization to create
it, merge or deploy: target-schema/migration policy, hosted CI, deployment budgets
and release ownership remain no-go gates. Luck activation additionally requires
product sign-off on the provisional window and Shimon's separate client acceptance.


## Historical artifact availability

The approved original c1-review-bundle.zip is not available at packaging time in
server/target or Downloads. No restoration or 493-entry validation of that old archive
is claimed. Existing C1 tests regenerate ignored target/c1-evidence outputs; fresh C2
outputs are captured separately with provenance. C1 code identity is independently
verified from its retained run metadata (all 526 initial Java hashes match), and no
committed C1 code was overwritten. Preserve the original external review archive if
available to the reviewer; this C2 package does not replace that historical archive.

## Complete C2 review-only file inventory

- `docs/01-server/SERVER_IMPLEMENTATION_PLAN.md`
- `docs/01-server/reviews/s4-04-c2/C2_C5_SERVER_HANDOFF_CHECK.md`
- `docs/01-server/reviews/s4-04-c2/C2_CI_PROPOSAL_EN.md`
- `docs/01-server/reviews/s4-04-c2/C2_DB_BUDGET_AND_RELEASE_GATES_EN.md`
- `docs/01-server/reviews/s4-04-c2/C2_PR_READINESS_REPORT_EN.md`
- `docs/01-server/reviews/s4-04-c2/C2_REVIEW_HE.md`
- `docs/01-server/reviews/s4-04-c2/C2_SCHEMA_MIGRATION_PROPOSAL_EN.md`
- `docs/01-server/reviews/s4-04-c2/draft-expansion.sql`
- `docs/01-server/reviews/s4-04-c2/draft-preflight.sql`
- `docs/01-server/reviews/s4-04-c2/draft-server-ci.yml.example`
- `server/src/test/java/com/quiz_wheelz/controller/StudentRaceLiveStreamSecurityTest.java`
- `server/src/test/java/com/quiz_wheelz/service/raceplayer/RaceArbitrationMySqlTest.java`
- `server/src/test/java/com/quiz_wheelz/service/raceplayer/RaceChronologyIntegrationFixture.java`
