# Development Infrastructure — Local MySQL and Automatic Redis

**Status:** Canonical  
**Audit date:** 2026-07-30  
**Code baseline:** `main@47fe75fa763af2ecc4deb4e8bc972f564ee73b15`  
**This document owns:** the target local environment, current bug, migration steps and verification

> The code is authoritative for what is implemented. This document is authoritative
> for the agreed direction and work order. When they disagree, verify the code first,
> then update this document in the same pull request.
## Decision

```text
Keep Redis.
Do not replace it with Caffeine before the playable loop.
```

Redis already supports presence, TTL, heartbeat and reconnect behavior. Replacing it
now creates a high-risk refactor without improving the core product.

## Current implementation

Development uses the developer's existing MySQL service and database at
`localhost:3306/quiz_wheelz`. Docker Compose does not own DEV MySQL. Spring Boot
starts and stops Redis automatically from `server/compose.yaml`, waits for its
health check, and applies its generated connection details. The Redis host port is
dynamic and bound only to localhost. Development Redis intentionally has no
password; production Redis remains separate and requires its external password and
SSL configuration.

## Architecture

```text
DEV
Spring Boot
├── local developer-owned MySQL
│   └── localhost:3306/quiz_wheelz
└── Redis
    └── Spring Boot managed Docker Compose
```

## Infrastructure owner

Backend-owned file:

```text
server/compose.yaml
```

Service:

```text
redis
```

Normal workflow:

```text
Run QuizWheelzApplication
→ Spring Boot runs docker compose up
→ Redis health check passes
→ Redis connection details are applied
→ application connects to local MySQL at localhost:3306
→ app starts
→ stopping app stops DEV Redis
```

The existing local MySQL service and `quiz_wheelz` database are prerequisites.
Docker Desktop and Docker Compose are required for Redis. No manual
`docker compose up` should be part of normal daily work.

IntelliJ developers should use the shared `QuizWheelzApplication` configuration in
`.run/`. Its working directory is `$PROJECT_DIR$/server`, allowing the DEV profile
to resolve `server/compose.yaml` correctly. Do not use the repository root as the
backend working directory when launching the application through IntelliJ.

## Compose shape

```yaml
services:
  redis:
    image: redis:7.4-alpine
    ports:
      - "127.0.0.1::6379"
    command: ["redis-server", "--appendonly", "yes"]
    volumes:
      - quizwheelz_redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 5s
      retries: 20
      start_period: 5s

volumes:
  quizwheelz_redis_data:
```

This Compose file does not create, migrate or manage the local MySQL database.

## Spring development profile

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/quiz_wheelz?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=Asia/Jerusalem
spring.datasource.username=${DB_USERNAME:root}
spring.datasource.password=${DB_PASSWORD:}

spring.docker.compose.enabled=true
spring.docker.compose.file=compose.yaml
spring.docker.compose.lifecycle-management=start-and-stop
spring.docker.compose.readiness.timeout=60s
```

DEV uses the explicit local MySQL datasource above. Redis uses the Spring Boot
Compose service connection and does not define explicit host, port or password
properties.

Production profiles never start Docker Compose.

## Test profile

Tests must use H2 unless a focused integration test explicitly uses containers.

```properties
spring.docker.compose.enabled=false
QUIZWHEELZ_REDIS_ENABLED=false
QUIZWHEELZ_REDIS_REQUIRED=false
management.health.redis.enabled=false
```

## Runtime reliability

S0-01 and S0-02 are implemented and verified. Heartbeat and presence are Redis-first
with a 45-second presence TTL. Redis gates the durable `RacePlayer.lastSeenAt`
checkpoint to one opportunity every 30 seconds. Reconnect uses a 5-minute grace
period, with a 30-second safety margin only when the Redis timestamp is unavailable
and the decision relies on durable state.

During a runtime Redis outage, heartbeat checkpoints fall back directly to durable
MySQL state. When Redis is reachable but runtime keys are missing, the application
rehydrates them; after Redis recovery, subsequent heartbeats return to the
Redis-first path.

Redis heartbeat timestamps are stored as absolute Unix epoch milliseconds (C1-02K),
never as zone-less ISO local date-time strings. A leftover legacy ISO value reads as
unusable (`Optional.empty`) and the durable fallback above covers it until the next
heartbeat rewrites the key in epoch format; TTLs, the checkpoint gate and the
reconnect policy are unchanged.

One DEV infrastructure limitation remains: a literal Redis container stop/start can
receive a different dynamic host port while the already-running Spring Boot process
remains bound to the startup endpoint. Pause/unpause preserves the endpoint and was
used to verify runtime outage and recovery. Changing this behavior is outside S0-03.

## Development prerequisite

A developer must have the local MySQL service available at `localhost:3306` with
credentials supplied through `DB_USERNAME` and `DB_PASSWORD` when they differ from
the DEV defaults. Spring Boot automates Redis only; it does not provision MySQL on a
clean clone.
