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
