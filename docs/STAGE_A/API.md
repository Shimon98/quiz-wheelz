# API Plan — Stage A

Base URL in development:

```text
http://localhost:8080
```

Frontend should use:

```env
VITE_API_BASE_URL=http://localhost:8080
```

When using Cookie JWT, frontend requests must include credentials.

Axios:

```js
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true,
});
```

Fetch:

```js
fetch(url, {
  method: "GET",
  credentials: "include",
});
```

---

## Auth API

### POST `/api/auth/login`

Logs in a teacher/admin. Server creates JWT and writes it into Cookie.

Request:

```json
{
  "username": "teacher1",
  "password": "123456"
}
```

Response:

```json
{
  "userId": 1,
  "displayName": "Teacher One",
  "role": "TEACHER"
}
```

Cookie:

```text
AUTH_TOKEN=<jwt>
```

Notes:

- Do not return JWT in response body.
- Do not store JWT in localStorage.

---

### GET `/api/auth/me`

Returns the connected user based on JWT Cookie.

Response:

```json
{
  "userId": 1,
  "displayName": "Teacher One",
  "role": "TEACHER"
}
```

If unauthenticated:

```json
{
  "message": "Unauthorized"
}
```

---

### POST `/api/auth/logout`

Clears the auth Cookie.

Response:

```json
{
  "message": "Logged out successfully"
}
```

---

## Subject API

### GET `/api/subjects`

Returns active subjects for create race form.

Response:

```json
[
  {
    "id": 1,
    "name": "חשבון",
    "code": "MATH"
  }
]
```

---

## Teacher Dashboard API

### GET `/api/teacher/dashboard`

Returns all data needed for teacher dashboard.

Response:

```json
{
  "teacherName": "Teacher One",
  "totalRaces": 3,
  "activeRaces": 1,
  "finishedRaces": 2,
  "races": [
    {
      "raceId": 10,
      "title": "כיתה ג - כפל",
      "roomCode": "J7K2",
      "subjectName": "חשבון",
      "status": "WAITING_FOR_PLAYERS",
      "maxPlayers": 8,
      "currentPlayers": 0,
      "createdAt": "2026-06-16T12:00:00"
    }
  ]
}
```

---

## Teacher Race API

### GET `/api/teacher/races`

Returns all races owned by the connected teacher.

Response:

```json
[
  {
    "raceId": 10,
    "title": "כיתה ג - כפל",
    "roomCode": "J7K2",
    "subjectName": "חשבון",
    "status": "WAITING_FOR_PLAYERS",
    "maxPlayers": 8,
    "currentPlayers": 0,
    "createdAt": "2026-06-16T12:00:00"
  }
]
```

---

### POST `/api/teacher/races`

Creates a new race.

Request:

```json
{
  "title": "כיתה ג - כפל",
  "subjectId": 1,
  "maxPlayers": 8,
  "totalDistance": 1000
}
```

Validation:

- `title` required.
- `subjectId` must exist and be active.
- `maxPlayers` should be between 1 and 8.
- `totalDistance` should be positive.

Response:

```json
{
  "raceId": 10,
  "title": "כיתה ג - כפל",
  "roomCode": "J7K2",
  "subjectName": "חשבון",
  "status": "WAITING_FOR_PLAYERS",
  "maxPlayers": 8,
  "currentPlayers": 0,
  "createdAt": "2026-06-16T12:00:00"
}
```

---

### GET `/api/teacher/races/{raceId}`

Returns a single race owned by the connected teacher.

Response:

```json
{
  "raceId": 10,
  "title": "כיתה ג - כפל",
  "roomCode": "J7K2",
  "subjectName": "חשבון",
  "status": "WAITING_FOR_PLAYERS",
  "maxPlayers": 8,
  "currentPlayers": 0,
  "createdAt": "2026-06-16T12:00:00"
}
```

---

### GET `/api/teacher/races/{raceId}/room`

Returns data for basic teacher race room page.

Response:

```json
{
  "raceId": 10,
  "title": "כיתה ג - כפל",
  "roomCode": "J7K2",
  "subjectName": "חשבון",
  "status": "WAITING_FOR_PLAYERS",
  "maxPlayers": 8,
  "currentPlayers": 0,
  "players": []
}
```
