import { STUDENT_JOIN_STORAGE_KEY } from "../config/studentJoinConfig";

// Join-response DISPLAY cache only — never session truth; missing is normal.
export function readStoredJoinData() {
  try {
    const raw = sessionStorage.getItem(STUDENT_JOIN_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
