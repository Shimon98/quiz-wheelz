import { STUDENT_JOIN_STORAGE_KEY } from "../config/studentJoinConfig";

const text = (value) => (typeof value === "string" ? value : undefined);
const count = (value) => (Number.isSafeInteger(value) ? value : undefined);

// Only what the waiting room shows, whatever else the join response carries now or later.
function toJoinDisplayData(source) {
  return {
    player: { displayName: text(source?.player?.displayName), laneNumber: count(source?.player?.laneNumber) },
    raceTitle: text(source?.raceTitle),
    roomCode: text(source?.roomCode),
    currentPlayers: count(source?.currentPlayers),
    maxPlayers: count(source?.maxPlayers),
  };
}

// A blocked or full storage only costs these extras: the join itself already succeeded.
export function storeJoinData(joinResponse) {
  try {
    sessionStorage.setItem(STUDENT_JOIN_STORAGE_KEY, JSON.stringify(toJoinDisplayData(joinResponse)));
  } catch {
    // The waiting room falls back to the server's race-state.
  }
}

// Join-response DISPLAY cache only — never session truth; missing is normal.
export function readStoredJoinData() {
  try {
    const raw = sessionStorage.getItem(STUDENT_JOIN_STORAGE_KEY);
    if (!raw) return null;
    const data = toJoinDisplayData(JSON.parse(raw));
    // A value stored before this allowlist is trimmed to these fields on its first read.
    if (JSON.stringify(data) !== raw) storeJoinData(data);
    return data;
  } catch {
    return null;
  }
}
