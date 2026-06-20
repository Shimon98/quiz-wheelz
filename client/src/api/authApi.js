import httpClient from "./httpClient";
import { API_ENDPOINTS } from "../constants/apiEndpointConstants";

export async function loginUser({ username, password }) {
  const response = await httpClient.post(API_ENDPOINTS.AUTH.LOGIN, {
    username,
    password,
  });

  return response.data;
}

export async function getCurrentUser() {
  const response = await httpClient.get(API_ENDPOINTS.AUTH.ME);

  return response.data;
}

export async function logoutUser() {
  return await httpClient.post(API_ENDPOINTS.AUTH.LOGOUT);
}
