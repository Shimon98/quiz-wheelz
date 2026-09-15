import httpClient from "./httpClient";
import { unwrapApiResponse } from "./apiResponseUtils.js";
import { API_ENDPOINTS } from "../constants/apiEndpointConstants";

export async function getTeacherRaceLiveState(raceId) {
  const response = await httpClient.get(
    API_ENDPOINTS.TEACHER.RACE_LIVE_STATE(raceId),
  );

  return unwrapApiResponse(response);
}

export function createTeacherRaceEventSource(raceId, afterVersion) {
  const url = httpClient.getUri({
    url: API_ENDPOINTS.TEACHER.RACE_EVENTS_STREAM(raceId),
    params: { afterVersion },
  });

  return new EventSource(url, { withCredentials: true });
}
