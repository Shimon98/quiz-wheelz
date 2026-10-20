# S4-04 C2 — CI proposal (unapplied)

No `.github/workflows` folder or approved CI convention exists in the inspected
checkout. No actual workflow, POM or wrapper file was modified. Hosted CI remains
PENDING. Local Windows Maven verification is not a GitHub Actions or Linux result.

## Two options for owner review

1. Minimal PR workflow with independent ordinary, Luck MySQL and arbitration MySQL
   jobs. Recommended first: few moving parts and clear ownership/isolation; duplicated
   setup has a small maintenance cost. `draft-server-ci.yml.example` is this proposal.
2. Reusable workflow taking suite/database parameters, called by separate PR jobs.
   Reduces repeated setup for more repos/branches, but adds interface, permissions,
   versioning and debugging burden before this project has a first hosted baseline.

This is an ADR proposal, not an adopted team decision. Before applying either, review
action immutable SHA pins, runner support/quotas, wrapper distribution trust, retention,
required-check rules and the exact patch to workflow/config. Tags in this draft are
illustrative; they are not an approval to adopt a new action version automatically.

## Draft contract and jobs

PR trigger covers server and server-contract/docs paths; contents:read only;
checkout persists no credentials; no pull_request_target, deployment, target DB
secret or publish token is used. Java is Temurin 21. Linux Ubuntu runner is proposed
for Docker service support. Each MySQL job gets its own new service and random mapped
host port; the URL deliberately uses 127.0.0.1 and the exact test-gated database name.
The lab digest is pinned; multi-architecture/runner availability remains a hosted gate.

| Job | Command in server/ | Database and gate |
|---|---|---|
| Ordinary server | bash ./mvnw -B verify | H2/test profile, MySQL env absent; explicitly report gated skips |
| Luck/B1/B2/C1 | bash ./mvnw -B "-Dtest=*Luck*,B2*,C1*,*Challenge*,*RaceArbitration*" test | quizwheelz_s4_luck_test; QUIZWHEELZ_LUCK_MYSQL_TEST_URL/USER/PASSWORD |
| Independent legacy arbitration | bash ./mvnw -B -Dtest=RaceArbitrationMySqlTest test | quizwheelz_c2_test; QUIZWHEELZ_C2_MYSQL_TEST_URL/USER/PASSWORD |
| Optional migration smoke (not activated) | build exact main baseline -> synthetic seed -> guarded draft expansion -> current validate -> negative/partial controls | distinct synthetic schemas; only after migration policy and baseline identity are approved |

The legacy arbitration C2 test name predates and is unrelated to S4-04 Checkpoint C2.
Its two cases are counted separately. Test profiles disable Compose and Redis; no
daily DEV service is needed. MySQL assertions establish actual product/dialect and RR
writers; private committed reads retain READ_COMMITTED. mysqladmin health is bounded;
tests still prove authentication/schema/isolation. Job timeouts are proposed 20/25 min
and must be adjusted against real hosted durations instead of treating them as SLAs.

Maven wrapper is 3.3.4/only-script, distribution Maven 3.9.16. Linux Git mode is 100644,
so use bash ./mvnw rather than assume executable permissions. The draft verifies
reviewed Git-LF SHA-256 of both wrapper and its properties. Source changes require
reviewing updated hashes. The committed properties currently omit a distribution
checksum; the draft obtains a fixed-version archive and its vendor SHA-512 over HTTPS,
checks it and sets distributionSha256Sum only in the ephemeral CI checkout before
the wrapper runs. This is proposed ephemeral preparation, not an adopted source change.
Pinning an independently reviewed distribution digest is preferable before adoption;
same-origin checksum download is integrity checking, not independent authenticity.
The draft exports a fresh RUNNER_TEMP-based MAVEN_USER_HOME, refuses an existing
wrapper directory and propagates it via GITHUB_ENV; this prevents a cached wrapper
installation from bypassing download checksum validation. setup-java's Maven
dependency cache is keyed by server/pom.xml; no credentials or runtime DB state is cached.

Each service credential is derived for this ephemeral job, masked before Maven and
never a target/environment secret. No password is embedded in the proposal or review
bundle. Before adoption enforce log/XML redaction for that exact generated value and
limit uploads to redacted logs/JUnit XML. The example registers a mask for streamed logs and explicitly redacts that exact
value from retained files before artifact upload; a failed redaction prevents upload.
Do not upload target/**, raw environment dumps, connection secrets or entire workspaces.
Artifacts are retained 14 days even on failure. Preserve expected rollback and
Hibernate create/drop warnings; failure exit survives tee via pipefail.

Local checks: SnakeYAML from already installed Spring libraries parsed the draft's
three jobs; Git Bash -n checked eight extracted step bodies plus the Git-LF wrapper.
No parser dependency was added. These are syntax checks, not action schema validation
or execution. No Linux runner, actionlint, GitHub permission boundary, artifact upload,
fork-PR or service startup was executed remotely. Hosted CI green remains PENDING.

Local command results are in C2_PR_READINESS_REPORT_EN.md and *-run.json/XML in the
evidence. The proposed workflow itself has never run. Optional migration smoke must
not become a deploy step or silently select a migration framework.

References: [GitHub service-container networking](https://docs.github.com/en/actions/tutorials/use-containerized-services/use-docker-service-containers)
and [Apache Maven Wrapper checksum guidance](https://maven.apache.org/tools/wrapper/).
Repository wrapper code and the retained local runs establish project-specific facts.
