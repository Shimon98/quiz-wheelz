import {MOCK_TEACHER_USER} from "../constants/authConstants.js";
import {ERROR_CODES} from "../constants/errorCodes.js";

export async function loginTeacher({ username, password }) {
  await new Promise((resolve) => setTimeout(resolve, 500));

  if (
      username === MOCK_TEACHER_USER.username &&
      password === MOCK_TEACHER_USER.password
  ) {
    return MOCK_TEACHER_USER.user;
  }

  const error = new Error('Invalid credentials');

  error.response = {
    data: {
      errorCode: ERROR_CODES.INVALID_CREDENTIALS,
    },
  };

  throw error;
}