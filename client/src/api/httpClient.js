import axios from "axios";

import { LOCAL_DEV_API_BASE_URL } from "../constants/apiEndpointConstants.js";

// client/.env is not in git, so a fresh clone has no VITE_API_BASE_URL: `npm run dev` then talks to the local server.
// A production build never guesses an address; it must be built with VITE_API_BASE_URL.
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? LOCAL_DEV_API_BASE_URL : undefined);

const httpClient = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

httpClient.interceptors.response.use(
  (response) => response.data,
  (error) => Promise.reject(error),
);

export default httpClient;
