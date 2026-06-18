import httpClient from "./httpClient";

export async function getSubjects() {
  const response = await httpClient.get("/subjects");

  return response.data;
}
