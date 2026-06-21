import httpClient from "./httpClient";
import { API_ENDPOINTS } from "../constants/apiEndpointConstants";
import { unwrapApiResponse } from "./apiResponseUtils.js";

export async function loginUser({ username, password }) {
  const response = await httpClient.post(API_ENDPOINTS.AUTH.LOGIN, {
    username,
    password,
  });

  return unwrapApiResponse(response);
}

export async function getCurrentUser() {
  const response = await httpClient.get(API_ENDPOINTS.AUTH.ME);

  return unwrapApiResponse(response);
}

export async function logoutUser() {
  const response = await httpClient.post(API_ENDPOINTS.AUTH.LOGOUT);

  return unwrapApiResponse(response);
}
