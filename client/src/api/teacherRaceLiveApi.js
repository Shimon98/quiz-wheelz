import httpClient from "./httpClient";
import { unwrapApiResponse } from "./apiResponseUtils.js";
import { API_ENDPOINTS } from "../constants/apiEndpointConstants";

export async function getTeacherRaceLiveState(raceId) {
  const response = await httpClient.get(
    API_ENDPOINTS.TEACHER.RACE_LIVE_STATE(raceId),
  );

  return unwrapApiResponse(response);
}
