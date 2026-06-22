import httpClient from "./httpClient";
import { API_ENDPOINTS } from "../constants/apiEndpointConstants";
import { unwrapApiResponse } from "./apiResponseUtils.js";

export async function getTeacherDashboard() {
  const response = await httpClient.get(API_ENDPOINTS.TEACHER.DASHBOARD);

  return unwrapApiResponse(response);
}

export async function createTeacherRace(payload) {
  const response = await httpClient.post(API_ENDPOINTS.TEACHER.RACES, payload);

  return unwrapApiResponse(response);
}

export async function getTeacherRaceRoom(raceId) {
  const response = await httpClient.get(API_ENDPOINTS.TEACHER.RACE_ROOM(raceId));

  return unwrapApiResponse(response);
}
