# Automatic Development Infrastructure — MySQL and Redis

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

Development uses `server/compose.yaml` as the single owner of local MySQL and Redis.
Spring Boot starts and stops both services automatically, waits for their health
checks, and applies their generated connection details. Both host ports are dynamic
and bound only to localhost. Development Redis intentionally has no password;
production Redis remains separate and requires its external password and SSL
configuration. This implementation and clean DEV startup are complete and verified
on Diana's machine; clean-clone verification on a second development machine is
still pending.

## Target

Backend-owned file:

```text
server/compose.yaml
```

Services:

```text
mysql
redis
```

Normal workflow:

```text
Run QuizWheelzApplication
→ Spring Boot runs docker compose up
→ health checks pass
→ connection details are applied
→ app starts
→ stopping app stops dev services
```

Docker Desktop and Docker Compose are prerequisites. No manual `docker compose up`
should be part of normal daily work.

IntelliJ developers should use the shared `QuizWheelzApplication` configuration in
`.run/`. Its working directory is `$PROJECT_DIR$/server`, allowing the DEV profile
to resolve `server/compose.yaml` correctly. Do not use the repository root as the
backend working directory when launching the application through IntelliJ.

## Target Compose shape

```yaml
services:
  mysql:
    image: mysql:8.4
    environment:
      MYSQL_DATABASE: quiz_wheelz
      MYSQL_USER: quizwheelz
      MYSQL_PASSWORD: quizwheelz-local
      MYSQL_ROOT_PASSWORD: quizwheelz-root-local
    ports:
      - "127.0.0.1::3306"
    volumes:
      - quizwheelz_mysql_data:/var/lib/mysql
    labels:
      org.springframework.boot.jdbc.parameters: "useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=Asia/Jerusalem"
    healthcheck:
      test: ["CMD-SHELL", "mysqladmin ping -h localhost -u root -p$$MYSQL_ROOT_PASSWORD --silent"]
      interval: 5s
      timeout: 5s
      retries: 20
      start_period: 10s

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
  quizwheelz_mysql_data:
  quizwheelz_redis_data:
```

The local MySQL application user is separate from the root administration account.
Never reuse local defaults in production.

## Spring development profile

Target:

```properties
spring.docker.compose.enabled=true
spring.docker.compose.file=compose.yaml
spring.docker.compose.lifecycle-management=start-and-stop
spring.docker.compose.readiness.timeout=60s
```

DEV uses Spring Boot Compose service connections. It does not define explicit
datasource or Redis host, port or password properties.

Production profiles never start Docker Compose.

## Test profile

Tests must use H2 unless a focused integration test explicitly uses containers.

```properties
spring.docker.compose.enabled=false
QUIZWHEELZ_REDIS_ENABLED=false
QUIZWHEELZ_REDIS_REQUIRED=false
management.health.redis.enabled=false
```

## Reconnect durability fix

Current heartbeat data cannot exist only in Redis.

Target flow:

```text
heartbeat
→ refresh Redis online key + last-heartbeat TTL
→ periodically persist RacePlayer.lastSeenAt

reconnect
→ Redis timestamp
→ if absent, DB lastSeenAt
→ if absent, race startedAt/policy fallback
```

Tests:

- Redis available
- Redis empty
- Redis restarted
- reconnect within grace
- reconnect after grace
- player already finished
- race already finished.

## Remaining runtime reliability work

S0-01 implementation is complete on Diana's machine: the backend-owned Compose
environment, automatic lifecycle, service connections, health checks and test
isolation are verified there. Verification on a second development machine is still
pending, so S0-01 remains `VERIFY LOCALLY / PARTIAL`. S0-02 remains pending and owns
the durable `RacePlayer.lastSeenAt` heartbeat fallback described above.

## Clean-clone definition of done

A developer with Java, Node and Docker Desktop can clone the repository, run the
Spring Boot application and receive a healthy MySQL/Redis-backed server without
creating a database, entering SQL, starting Redis manually or editing source files.
