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
export async function getCurrentQuestion() {
  const response = await httpClient.get(
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
