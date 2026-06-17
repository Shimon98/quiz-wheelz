import { MOCK_AUTH_USERS } from "../constants/authConstants.js";
import { ERROR_CODES } from "../errors/errorCodes.js";

const USE_MOCK_AUTH = import.meta.env.VITE_USE_MOCK_AUTH !== "false";

function createInvalidCredentialsError() {
  const error = new Error("Invalid credentials");

  error.response = {
    data: {
      errorCode: ERROR_CODES.INVALID_CREDENTIALS,
    },
  };

  return error;
}

export async function loginUser({ username, password }) {
  if (!USE_MOCK_AUTH) {
    // Later: return httpClient.post("/auth/login", { username, password });
    throw new Error("Real backend auth is not connected yet");
  }

  await new Promise((resolve) => setTimeout(resolve, 500));

  const mockUser = MOCK_AUTH_USERS.find(
    (candidate) =>
      username === candidate.username && password === candidate.password
  );

  if (mockUser) {
    return mockUser.user;
  }

  throw createInvalidCredentialsError();
}
