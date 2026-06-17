import { MOCK_TEACHER_USER } from "../constants/authConstants.js";
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

export async function loginTeacher({ username, password }) {
  if (!USE_MOCK_AUTH) {
    // Later: return httpClient.post("/auth/login", { username, password });
    throw new Error("Real backend auth is not connected yet");
  }

  await new Promise((resolve) => setTimeout(resolve, 500));

  const isValidMockTeacher =
    username === MOCK_TEACHER_USER.username &&
    password === MOCK_TEACHER_USER.password;

  if (isValidMockTeacher) {
    return MOCK_TEACHER_USER.user;
  }

  throw createInvalidCredentialsError();
}
