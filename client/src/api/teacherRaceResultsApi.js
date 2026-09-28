import httpClient from "./httpClient";
import { unwrapApiResponse } from "./apiResponseUtils.js";
import { API_ENDPOINTS } from "../constants/apiEndpointConstants";

export async function getTeacherRaceResults(raceId) {
  const response = await httpClient.get(API_ENDPOINTS.TEACHER.RACE_RESULTS(raceId));

  return unwrapApiResponse(response);
}
