const API = process.env.QW_API_BASE ?? "http://localhost:8080/api";
const TEACHER = { username: process.env.QW_TEACHER_USER ?? "GojoSatoru", password: process.env.QW_TEACHER_PASSWORD ?? "123456" };
const POLL_MS = 2000;
const HEARTBEAT_EVERY_POLLS = 7;
const RUNNING_RACE_STATUSES = new Set(["IN_PROGRESS"]);
const ENDED_RACE_STATUSES = new Set(["FINISHED", "COMPLETED", "CANCELLED"]);

const options = { bots: 6, maxPlayers: 8, distance: 1000, title: "Dev bots race", answerEverySeconds: 0, start: false, seconds: 0 };
for (const argument of process.argv.slice(2)) {
  const [key, value] = argument.replace(/^--/, "").split("=");
  if (key === "bots") options.bots = Number(value);
  else if (key === "maxPlayers") options.maxPlayers = Number(value);
  else if (key === "distance") options.distance = Number(value);
  else if (key === "title") options.title = value;
  else if (key === "answer") options.answerEverySeconds = Number(value);
  else if (key === "start") options.start = true;
  else if (key === "seconds") options.seconds = Number(value);
  else if (key === "help") { printHelp(); process.exit(0); }
}

function printHelp() {
  console.log(`node scripts/devRaceBots.mjs [--bots=6] [--maxPlayers=8] [--distance=1000] [--title=...] [--answer=<seconds>] [--start] [--seconds=<n>]
Creates a race as the dev teacher, joins the bots and keeps them online (polling + heartbeat) until Ctrl+C.
Join the free slots from real browsers with the printed room code, then start the race from the teacher dashboard (or pass --start).
--answer=N makes every bot answer its current question correctly every N seconds. --seconds=N exits automatically after N seconds.
Env: QW_API_BASE (default ${API}), QW_TEACHER_USER, QW_TEACHER_PASSWORD.`);
}

function cookieFrom(response, name) {
  for (const line of response.headers.getSetCookie?.() ?? []) {
    const match = line.match(new RegExp(`^${name}=([^;]*)`));
    if (match) return `${name}=${match[1]}`;
  }
  throw new Error(`missing ${name} cookie`);
}

async function call(path, { method = "GET", body, cookie } = {}) {
  const response = await fetch(`${API}${path}`, {
    method,
    headers: { "Content-Type": "application/json", ...(cookie ? { Cookie: cookie } : {}) },
    body: body == null ? undefined : JSON.stringify(body),
  });
  const json = await response.json().catch(() => null);
  if (!response.ok) throw new Error(`${method} ${path} -> ${response.status} ${JSON.stringify(json)}`);
  return { data: json?.data, response };
}

function solve(questionText) {
  const expression = questionText.replace(/=.*$/, "").replace(/[×x]/g, "*").replace(/[÷:]/g, "/")
    .replace(/[−–]/g, "-").replace(/[^0-9+\-*/(). ]/g, "");
  try { return Function(`return (${expression})`)(); } catch { return null; }
}

async function answerCurrentQuestion(bot) {
  const { data: question } = await call("/race-players/me/question/current", { method: "POST", cookie: bot.cookie });
  const value = solve(question.questionText ?? "");
  const choice = question.choices?.find((candidate) => Number(candidate.choiceText) === value);
  if (choice == null) return `no matching choice for "${question.questionText}"`;
  await call("/race-players/me/answers", { method: "POST", cookie: bot.cookie, body: { questionId: question.questionId, choiceId: choice.choiceId } });
  return `answered ${question.questionText} ${value}`;
}

async function raceStateWithReconnect(bot) {
  const fetchState = () => call("/race-players/me/race-state", { cookie: bot.cookie }).then((result) => result.data);
  try {
    return await fetchState();
  } catch (error) {
    if (!error.message.includes("RACE_PLAYER_RECONNECT_REQUIRED")) return { error };
    await call("/race-players/me/reconnect", { method: "POST", cookie: bot.cookie }).catch(() => null);
    return fetchState().catch((retryError) => ({ error: retryError }));
  }
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const { response: loginResponse } = await call("/auth/login", { method: "POST", body: TEACHER });
const teacherCookie = cookieFrom(loginResponse, "AUTH_TOKEN");
const subjects = (await call("/subjects", { cookie: teacherCookie })).data;
const race = (await call("/teacher/races", { method: "POST", cookie: teacherCookie,
  body: { title: options.title, subjectId: subjects[0].id, maxPlayers: options.maxPlayers, totalDistance: options.distance } })).data;
const bots = [];
for (let index = 1; index <= options.bots; index += 1) {
  const displayName = `Bot ${index}`;
  const { data, response } = await call("/race-players/join", { method: "POST", body: { roomCode: race.roomCode, displayName } });
  bots.push({ displayName, cookie: cookieFrom(response, "RACE_PLAYER_TOKEN"), lane: data.player?.laneNumber });
}
console.log(`race ${race.raceId} room code ${race.roomCode}: ${bots.length} bots joined (lanes ${bots.map((bot) => bot.lane).join(", ")}), ${options.maxPlayers - bots.length} free slots`);
console.log(options.start ? "starting the race now" : "join the free slots from real browsers, then start the race from the teacher dashboard; Ctrl+C stops the bots");
if (options.start) await call(`/teacher/races/${race.raceId}/start`, { method: "POST", cookie: teacherCookie });

const startedAt = Date.now();
let polls = 0;
let lastAnswerAt = 0;
let raceStatus = null;
while (options.seconds === 0 || Date.now() - startedAt < options.seconds * 1000) {
  polls += 1;
  for (const bot of bots) {
    if (polls % HEARTBEAT_EVERY_POLLS === 1) await call("/race-players/me/heartbeat", { method: "POST", cookie: bot.cookie }).catch(() => null);
    const state = await raceStateWithReconnect(bot);
    if (state.error) { console.log(`${bot.displayName}: ${state.error.message}`); continue; }
    const nextStatus = state.raceStatus ?? state.status ?? state.snapshot?.raceStatus ?? null;
    if (nextStatus !== raceStatus) { raceStatus = nextStatus; console.log(`race status ${raceStatus}`); }
  }
  if (ENDED_RACE_STATUSES.has(raceStatus)) break;
  const answerDue = options.answerEverySeconds > 0 && RUNNING_RACE_STATUSES.has(raceStatus) &&
    Date.now() - lastAnswerAt >= options.answerEverySeconds * 1000;
  if (answerDue) {
    lastAnswerAt = Date.now();
    for (const bot of bots) console.log(`${bot.displayName}: ${await answerCurrentQuestion(bot).catch((error) => error.message)}`);
  }
  await sleep(POLL_MS);
}
console.log("bots stopped");
