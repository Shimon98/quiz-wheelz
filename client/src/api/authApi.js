import httpClient from "./httpClient";

export async function loginUser({ username, password }) {
  const response = await httpClient.post("/auth/login", {
    username,
    password,
  });

  return response.data;
}

export async function getCurrentUser() {
  const response = await httpClient.get("/auth/me");

  return response.data;
}

export async function logoutUser() {
  return await httpClient.post("/auth/logout");
}