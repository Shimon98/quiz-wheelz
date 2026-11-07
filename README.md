# QuizWheelz

A real-time educational racing game: the teacher opens a race, students join with a room code and race by answering
math questions. The server (Spring Boot) owns every rule; the client (React + PixiJS) shows it.

## What you need

| Tool | Version | Why |
|---|---|---|
| JDK | 21 | the server (the Maven wrapper downloads Maven by itself) |
| Node.js | 22 LTS, or 20.19 and newer | the client (Vite 8) |
| MySQL Server | 8.x on `localhost:3306` | the database; the server creates `quiz_wheelz` and its tables on the first run |
| Docker Desktop | running | Redis, which the server starts and stops by itself (`server/compose.yaml`) |

## Run it

1. **MySQL**: make sure it runs on `localhost:3306` and that you know the password of a user that may create
   databases (usually `root`).
2. **Server**, from `server/`:
   - macOS / Linux / Git Bash: `DB_USERNAME=root DB_PASSWORD=<your MySQL password> ./mvnw spring-boot:run`
   - PowerShell: `$env:DB_USERNAME="root"; $env:DB_PASSWORD="<your MySQL password>"; .\mvnw.cmd spring-boot:run`
   - IntelliJ: run `QuizWheelzApplication` with the working directory `server/` and the environment variables
     `DB_USERNAME` and `DB_PASSWORD`.

   Wait for `Started QuizWheelzApplication`. Without any profile the server runs its local profile (`dev`).
3. **Client**, from `client/`: `npm ci`, then `npm run dev`, and open http://localhost:5173.
   `client/.env` is optional: without it the client talks to http://localhost:8080/api.
4. **Play**: sign in as a teacher with the local development account `GojoSatoru` / `123456` (the server has no
   teacher registration yet; it comes with S5). Create a race and join it from another browser or a phone with the
   room code (a race starts with at least two students).

> The development account and its password are public. They are for a local computer only; never expose this server
> to a public network as it is.

## What is on

Every normal run has the whole game, with no switch to set:
- Turbo and Safe challenges.
- Luck: Tailwind, Energy Orb and Mud, with the Guard Shield.
- Hidden Recovery for students who are both far behind and struggling. It is secret by design: no student and no
  teacher screen ever shows it.

To switch one off while investigating a problem, set its environment variable before starting the server:
`QUIZWHEELZ_LUCK_ANSWER_ENABLED=false` or `QUIZWHEELZ_RECOVERY_ENABLED=false`.

## Testing on a phone (same Wi-Fi)

A phone cannot reach your computer's `localhost`. Find the computer's address on the local network (for example
`192.168.1.20`: `ipconfig` on Windows, `ip addr` on Linux, the network settings on macOS), then:

1. Start the server with that origin allowed as well:
   `CORS_ALLOWED_ORIGINS=http://localhost:5173,http://192.168.1.20:5173` (plus the database variables above).
2. Create `client/.env` with `VITE_API_BASE_URL=http://192.168.1.20:8080/api`, then run `npm run dev -- --host`.
3. On the phone, open `http://192.168.1.20:5173`. If nothing loads, allow ports 5173 and 8080 in the computer's
   firewall.

## If something fails

| Message | Cause |
|---|---|
| `Luck peer limits and deployment connection budget must be explicitly valid` | the server runs a profile other than `dev`, `test` or `prod` without Luck's connection budget, or a variable sets that budget to 0 |
| `Application budget plus reserved connections exceeds MySQL max_connections` | MySQL allows fewer than 25 connections: check `SELECT @@max_connections;` (a stock install allows 151) |
| `Communications link failure` or `Access denied for user` | MySQL is not running on `localhost:3306`, or `DB_PASSWORD` is wrong |
| an error that mentions Docker or `compose` | Docker Desktop is not running |
| network errors in the browser | the server is not on port 8080, or `client/.env` points elsewhere |

## Tests

- Server: `cd server && ./mvnw clean test` (H2 in memory; needs no MySQL, Redis or Docker).
- Client: `cd client && npm run lint && npm test && npm run build`.

## Documentation

Start at `AGENTS.md` and `docs/README.md`.
