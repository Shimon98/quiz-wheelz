import httpClient from "./httpClient";
import { API_ENDPOINTS } from "../constants/apiEndpointConstants";

export async function getSubjects() {
  const response = await httpClient.get(API_ENDPOINTS.SUBJECTS.LIST);

  return response.data;
}
