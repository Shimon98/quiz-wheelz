import httpClient from "./httpClient.js";
import { unwrapApiResponse } from "./apiResponseUtils.js";
import { API_ENDPOINTS } from "../constants/apiEndpointConstants.js";

export async function requestFinishArbitration() {
  return unwrapApiResponse(await httpClient.post(API_ENDPOINTS.RACE_PLAYERS.FINISH_ARBITRATION));
}

export function createStudentRaceEventSource(afterVersion) {
  const url = httpClient.getUri({
    url: API_ENDPOINTS.RACE_PLAYERS.EVENTS_STREAM,
    params: { afterVersion },
  });
  return new EventSource(url, { withCredentials: true });
}
