import httpClient from "./httpClient";
import { API_ENDPOINTS } from "../constants/apiEndpointConstants";
import { unwrapApiResponse } from "./apiResponseUtils.js";

/*
 * Login is email-first by product direction, but the server (Diana's side)
 * currently authenticates by `username` — so the identifier the user typed
 * (email OR username) is sent in the `username` field. When the server moves
 * to email auth, only this mapping changes; forms and hooks stay as they are.
 */
export async function loginUser({ identifier, password }) {
  const response = await httpClient.post(API_ENDPOINTS.AUTH.LOGIN, {
    username: identifier,
    password,
  });

  return unwrapApiResponse(response);
}

export async function registerUser({ fullName, email, password, acceptsEmails }) {
  const response = await httpClient.post(API_ENDPOINTS.AUTH.REGISTER, {
    fullName,
    email,
    password,
    acceptsEmails,
  });

  return unwrapApiResponse(response);
}

export async function requestPasswordReset({ email }) {
  const response = await httpClient.post(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, {
    email,
  });

  return unwrapApiResponse(response);
}

export async function verifyResetCode({ email, code }) {
  const response = await httpClient.post(API_ENDPOINTS.AUTH.VERIFY_RESET_CODE, {
    email,
    code,
  });

  return unwrapApiResponse(response);
}

export async function resetPassword({ email, code, newPassword }) {
  const response = await httpClient.post(API_ENDPOINTS.AUTH.RESET_PASSWORD, {
    email,
    code,
    newPassword,
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
