import httpClient from "./httpClient";
import { API_ENDPOINTS } from "../constants/apiEndpointConstants";
import { unwrapApiResponse } from "../features/teacherDashboard/utils/apiResponseUtils";

export async function getSubjects() {
  const response = await httpClient.get(API_ENDPOINTS.SUBJECTS.LIST);

  return unwrapApiResponse(response);
}
