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

## Current audited problem

The current main branch:

- has a root Redis-only Compose file
- points Spring Boot to `docker-compose.redis.yml`
- starts with `start-only`
- marks Redis with `org.springframework.boot.ignore: true`
- still requires a separately installed/running local MySQL.

The configuration mixes Spring-owned lifecycle with manually defined connections and
does not provide a clean-clone environment.

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
      - "3306:3306"
    volumes:
      - quizwheelz_mysql_data:/var/lib/mysql
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 5s
      timeout: 5s
      retries: 20

  redis:
    image: redis:7.4-alpine
    command:
      - redis-server
      - --appendonly
      - "yes"
      - --requirepass
      - quizwheelz-local-redis
    ports:
      - "6379:6379"
    volumes:
      - quizwheelz_redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "-a", "quizwheelz-local-redis", "ping"]
      interval: 5s
      timeout: 5s
      retries: 20

volumes:
  quizwheelz_mysql_data:
  quizwheelz_redis_data:
```

The exact credentials may be moved to environment variables, but defaults must be
consistent and documented. Never reuse local defaults in production.

## Spring development profile

Target:

```properties
spring.docker.compose.enabled=true
spring.docker.compose.file=compose.yaml
spring.docker.compose.lifecycle-management=start-and-stop
spring.docker.compose.readiness.timeout=60s
```

Use one connection-detail strategy:

1. Prefer Spring Boot Compose service connections for dev when verified.
2. Otherwise use explicit properties consistently.
3. Do not combine ignore labels, auto connection details and conflicting local
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

## Migration checklist

1. Verify the local `chore/redis-dev-autostart` branch.
2. Add MySQL to Compose.
3. Move/rename Compose to the backend-owned location.
4. remove the ignore label
5. choose one connection-detail strategy
6. use `start-and-stop`
7. add both health checks
8. update test profile
9. add DB fallback
10. test clean clone
11. remove old Redis-only compose only after successful verification.

## Clean-clone definition of done

A developer with Java, Node and Docker Desktop can clone the repository, run the
Spring Boot application and receive a healthy MySQL/Redis-backed server without
creating a database, entering SQL, starting Redis manually or editing source files.
