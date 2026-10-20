# S4-04 C2 — database budget and release gates

No production/config default was changed. Current prod profile uses ddl-auto=validate,
external DB_URL/DB_USERNAME/DB_PASSWORD and required Redis. Target credentials and
metadata were not accessed. The startup probe uses the isolated test profile, not
the prod security/Redis topology: it proves schema mapping startup only.

## Configuration owner and deployment input matrix

| Canonical property / environment input | Known local fact | Required future owner input |
|---|---|---|
| spring.datasource.hikari.maximum-pool-size | no repo override; actual app startup measured W=10 | explicit maximum per deployed instance, not assumed 10 |
| spring.datasource.hikari.connection-timeout | actual app startup measured 30000 ms | approved queue/failure envelope |
| QUIZWHEELZ_LUCK_PEER_POOL_MAX_SIZE | R=2 default, minimumIdle=0, lazy, same primary URL/credentials | explicit R and total DB budget |
| QUIZWHEELZ_LUCK_PEER_ACQUIRE_TIMEOUT_MS | 2000 default, validation min(1000,acquire) | approved bounded timeout |
| QUIZWHEELZ_LUCK_PEER_QUERY_TIMEOUT_SECONDS | 2 default | approved bounded query timeout |
| QUIZWHEELZ_DB_MAX_APPLICATION_INSTANCES | runtime default 0; test profile 1 | real enforced N including surge/overlap during deploy |
| QUIZWHEELZ_DB_APPLICATION_CONNECTION_BUDGET | runtime default 0; test profile 64 | actual application allocation B |
| QUIZWHEELZ_DB_RESERVED_CONNECTIONS | runtime default 0; test profile 10 | explicit admin/monitoring/migration/jobs/other-client reserve |
| MySQL @@max_connections | lab 151 only | target value, topology, proxy/replica limits |
| DB_URL / DB_USERNAME / DB_PASSWORD | prod external; private reader copies primary | authorized target injection, privileges and rotation owner; no secret in artifacts |
| spring.jpa.hibernate.ddl-auto | prod validate | approved schema inventory + startup gate; OFF is insufficient |
| QUIZWHEELZ_LUCK_ANSWER_ENABLED | false injection default; no profile enables it | remain false through migration/release; activation requires separate approval |
| LuckRules.PROVISIONAL_ACTIVITY_WINDOW_MS | 60000 unchanged | explicit product decision before activation |
| REDIS_HOST/PORT/PASSWORD/SSL_ENABLED | prod requires external Redis | separately authorized readiness; unchanged |

Spring canonical writer properties above should be explicitly bound and observed in
the intended runtime before deployment. For environment binding, remove hyphens from
the final segment (e.g. SPRING_DATASOURCE_HIKARI_MAXIMUMPOOLSIZE), then verify the
effective Hikari value; no target variable was set in C2.

## Budget calculation and enforcement limits

Identical instances: N*(W+R)<=B and B+reserved<=DB_max_connections.
Nonidentical instances: SUM_i(W_i+R_i)<=B, with the same server-headroom inequality.
Migration/maintenance connections, background workers, admin, monitoring and other
applications must either be explicitly counted in B or assigned named portions of
reserved; never omit or double-count them. The deploy owner must also budget rolling
surge/old+new instances, per-server routing and pools retained during shutdown.

Lab-only illustration from measured writer 10 and default reader 2: maximum 12
connections per ordinary instance. Test inputs N=1/B=64/reserved=10/max=151 satisfy
12<=64 and 74<=151. These are test declarations, not a recommendation for production.
Some stress fixtures deliberately use different writer/reader maxima; those remain
bounded concurrency evidence. No measured latency or cached-context connection
high-water mark determines a deployment allocation or guarantees throughput.

LuckPeerJdbcResources requires positive limits and a Hikari primary before creating
its private pool; checks declared N*(W+R) against B and, on first MySQL read, B+reserve
against @@max_connections. OFF performs no pool acquisition; invalid undeclared
budgets fail closed when an ON path needs the reader. Internal reader errors roll
back the answer. The code does not discover actual instance counts, enforce an
autoscaler ceiling, reserve server slots, or dynamically revalidate changed topology.
Configured declarations and actual deployment controls must agree.

The retained final full and focused lab runs each contain ten repetitions of 2/4/8
same-race and cross-race groups, 280 successful measured answer operations per run.
Raw samples and independent active/idle/waiting peaks are in load-evidence.json.
Full-run p99 was 695.355ms for same-race-eight and 87.043ms for cross-race-eight;
focused values were 575.755ms and 97.227ms. Percentiles use nearest rank. Sampling is
1ms and may miss short peaks; maxima in the three peak columns occur independently
and must not be summed as a concurrent pool state. These are bounded service/JPA
harness observations, not HTTP measurements, an SLA or a production sizing argument.

## Independent gates

| Gate | C2 outcome / required evidence |
|---|---|
| SERVER_CODE_QA | unchanged A/B1/B2/C1 production identity, three test-fixture changes only; current local results listed separately in PR report |
| LOCAL_MIGRATION_REHEARSAL | synthetic exact-main schema -> draft expansion -> validate/restart succeeds; unexpanded/partial controls fail |
| MIGRATION_POLICY | UNDECIDED: method/framework, ledger/version, operator, checksum, repair/restore policy require approval |
| TARGET_SCHEMA_APPROVAL | UNKNOWN; actual authorized inventory, constraints, data, target engine and restoration rehearsal required |
| LOCAL_CI_BLUEPRINT | design/syntax and local commands only; action pins/hosted behavior not approved |
| HOSTED_CI_GREEN | PENDING; no authorized publication/run |
| POOL_TOPOLOGY_APPROVED | BLOCKED by unknown N/W/B/reserve/max/other consumers and deploy surge |
| PR_REVIEW_READY | recommendation for review-only artifacts, subject to exact patch/QA review; not PR creation permission |
| MERGE_COMPATIBLE | observed remote main matches local baseline, but merge/deploy gates remain open; no merge performed |
| MERGE/DEPLOY_READY | NO: schema/policy/CI/budget/release authorization missing |
| LUCK_ACTIVATION_READY | NO: all release gates + product 60s approval + Shimon's client acceptance required |
| CLIENT_ACCEPTANCE | Shimon; no React/Pixi/HUD/animation/audio/scheduling change or acceptance claim |

Release order proposal: approve migration ownership/method and real inventory ->
authorize backup/restore and maintenance window -> approve budget/topology and hosted
CI -> rehearse target-compatible expansion -> apply under separate operator approval
-> start current server with validate and flag OFF -> health/smoke and rollback
checkpoint -> separately approve client acceptance/product window/activation.
Do not merge into an automatically deployed branch before schema readiness is closed.
On schema-validation failure hold startup/deploy; on partial DDL hold writers and
require reviewed repair/restore. Feature OFF cannot fix missing mapped tables.
Never use destructive down-DDL as an automatic application rollback.

Final isolated MySQL metrics: lock_deadlocks=0, InnoDB lock_timeouts=0, Connection_errors_max_connections=0, Max_used_connections=110, max_connections=151. The expected metadata-lock 1205 control is distinct from InnoDB lock_timeouts. This high-water mark includes cached test contexts/probes and is not a target budget.
