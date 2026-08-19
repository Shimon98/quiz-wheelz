import httpClient from "./httpClient";
import { API_ENDPOINTS } from "../constants/apiEndpointConstants";
import { unwrapApiResponse } from "./apiResponseUtils.js";

/*
 * Student join — the server creates the RacePlayer and sets the
 * racePlayerToken COOKIE on this response (student identity is cookie-based,
 * like the teacher session; the client stores nothing sensitive).
 */
export async function joinRace({ roomCode, displayName }) {
  const response = await httpClient.post(API_ENDPOINTS.RACE_PLAYERS.JOIN, {
    roomCode,
    displayName,
  });

  return unwrapApiResponse(response);
}

/*
 * Gameplay wrappers stay thin: no navigation, UI text, or game logic. The
 * server owns correctness, score, progress, and runtime state; submitAnswer's
 * response carries the safe raceImpact the screen maps into its runtime state.
 * Question/answer actions are used only after the student runtime confirms
 * (via race-state) that the current RacePlayer is allowed to play.
 */
/*
 * Race-state bootstrap — the server resolves the RacePlayer session from the
 * cookie and returns race metadata + the shared runtime snapshot. Unlike the
 * question/answer actions, the server validates only the session here (any
 * race status), so screens can route by server truth from this response.
 */
export async function getRaceState() {
  const response = await httpClient.get(
    API_ENDPOINTS.RACE_PLAYERS.RACE_STATE,
  );

  return unwrapApiResponse(response);
}

/*
 * POST, not GET (C1-02K): the server "ensures" the current question — it can
 * expire the old one and generate the next — so this is a command-like
 * resolve on the same path, no body.
 */
export async function getCurrentQuestion() {
  const response = await httpClient.post(
    API_ENDPOINTS.RACE_PLAYERS.CURRENT_QUESTION,
  );

  return unwrapApiResponse(response);
}

export async function submitAnswer({ questionId, choiceId }) {
  const response = await httpClient.post(
    API_ENDPOINTS.RACE_PLAYERS.SUBMIT_ANSWER,
    { questionId, choiceId },
  );

  return unwrapApiResponse(response);
}

/*
 * Runtime-session commands (C1-05). The leave endpoint stays deliberately
 * unwired — it DISCONNECTS a non-finished player and must never fire from
 * refresh/unmount.
 */
export async function heartbeatRacePlayer() {
  const response = await httpClient.post(API_ENDPOINTS.RACE_PLAYERS.HEARTBEAT);

  return unwrapApiResponse(response);
}

export async function reconnectRacePlayer() {
  const response = await httpClient.post(API_ENDPOINTS.RACE_PLAYERS.RECONNECT);

  return unwrapApiResponse(response);
}
