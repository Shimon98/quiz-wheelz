# Issue 22 Manual Verification Notes

## Purpose

This document summarizes the manual Postman verification completed for Issue 22.

Issue 22 added the backend foundation for delivering persisted safe questions to students during an active race.

The main endpoint verified was:

```http
GET /api/race-players/me/question/current
```

---

## Why This Test Matters

The goal of Issue 22 was not only to generate questions, but to create a safe backend flow where:

```text
the server creates the question
the server stores the correct answer privately
the student receives only safe display data
the student is identified by cookie
the question belongs to the current race player
the race must be active before a question is served
```

This is important because the frontend should never receive the correct answer or any internal answer fields.

---

## Manual Test Environment

```text
Tool: Postman
Server: local Spring Boot server
Base URL: http://localhost:8080
Branch: feature/issue-22-player-question-delivery
```

---

## Flow That Was Verified

### 1. Server Health Check

Verified that the server was running:

```http
GET /actuator/health
```

Expected result:

```text
Server responds successfully.
Health status is UP.
```

---

### 2. Teacher Login

Verified teacher login using the development teacher account.

Expected result:

```text
Login succeeds.
AUTH_TOKEN cookie is stored in Postman.
Teacher-only endpoints can be accessed.
```

---

### 3. Load Active Subjects

Verified that active subjects can be loaded after teacher login.

Expected result:

```text
Math subject is returned and can be used for race creation.
```

---

### 4. Create Race

Verified that a teacher can create a new race.

Expected result:

```text
Race is created successfully.
Response includes raceId and roomCode.
Race starts in WAITING_FOR_PLAYERS status.
```

---

### 5. Students Join Race

Verified that students can join the race using the room code.

Expected result:

```text
RacePlayer records are created.
Players start in WAITING status.
RACE_PLAYER_TOKEN cookie is stored in Postman.
```

Two students were joined because the project currently requires at least two waiting players before starting a race.

---

### 6. Current Question Before Race Start

Verified that the student cannot receive a question before the race starts.

Request:

```http
GET /api/race-players/me/question/current
```

Expected result:

```text
Request is rejected because the player/race is not ready for gameplay.
```

This confirms the endpoint does not serve questions too early.

---

### 7. Start Race

Verified that the teacher can start the race.

Expected result:

```text
Race status becomes IN_PROGRESS.
Waiting players become RACING.
```

---

### 8. Student Requests Current Question

Verified the student can request the current question after the race starts.

Request:

```http
GET /api/race-players/me/question/current
```

Expected result:

```text
Student receives a safe question response.
The question is persisted in the database.
```

The safe response includes:

```text
questionId
questionText
timeLimitSeconds
expiresAt
choices
choiceId
choiceText
displayOrder
```

---

### 9. Safe Response Check

Verified that the response does not expose internal/correct answer data.

The response must not include:

```text
correctAnswerValue
answerValue
correct
racePlayer
questionTemplate
entity relationships
internal generated DTOs
```

This confirms that the frontend receives only safe display data.

---

### 10. Same Active Question Is Reused

Verified that calling the endpoint again before the question expires returns the same active question.

Expected result:

```text
Same questionId is returned.
No unnecessary new question is generated while the previous one is still ACTIVE.
```

---

### 11. Expired Question Behavior

Verified that after the time limit passes, the endpoint returns a new question.

Expected result:

```text
The old question is treated as expired.
A new question is generated, persisted, and returned.
```

---

## Result

Manual Postman verification passed successfully.

The Issue 22 backend flow is ready for PR review.

---

## What Issue 22 Now Supports

Issue 22 now supports:

```text
persistent player questions
safe student question DTOs
current-question endpoint
cookie-based race player identity
dynamic QuestionPlan creation
RACING player validation
IN_PROGRESS race validation
question expiration handling
cleanup policy for old inactive questions
```

---

## What Is Still Out of Scope

This issue intentionally does not implement:

```text
answer submission
answer validation result
score changes
race movement
difficulty updates
SSE/live updates
frontend question screen integration
```

These should be handled in later issues.

---

## Next Step

The next planned backend issue is:

```text
Issue 23 — Answer Validation and Submission
```

Expected future flow:

```text
student submits questionId + choiceId
server resolves current RacePlayer from cookie
server verifies the question belongs to that player
server checks the question is ACTIVE
server checks the question has not expired
server verifies the selected choice belongs to that question
server determines if the answer is correct
server marks the question ANSWERED or EXPIRED
server returns a safe result DTO
```

Scoring and race movement should remain for Issue 24.
