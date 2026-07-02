import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../../../api/authApi";
import { useAuthStore } from "../../../stores/authStore";
import { useLanguageStore } from "../../../stores/languageStore";
import useErrorMessage from "../../../hooks/useErrorMessage";
import { getRouteByRole } from "../../../utils/authRouteUtils";

/**
 * useTeacherLogin — all login screen logic, so the content component stays
 * display-only:
 *   - submit({ identifier, password }) → authApi → authStore → role redirect.
 *   - loading / submitting / server-error state (errorCode → localized text
 *     via the existing errors/errorUtils mapping).
 *
 * The "already signed in?" session check lives in GuestRoute, which wraps
 * the whole PublicEntryShell. The form's value state itself lives in the
 * component (@mantine/form).
 */
export default function useTeacherLogin() {
  const navigate = useNavigate();
  const language = useLanguageStore((state) => state.language);
  const { errorMessage, clearErrorMessage, setErrorMessageFromApiError } =
    useErrorMessage(language);

  const isLoading = useAuthStore((state) => state.isLoading);
  const setUser = useAuthStore((state) => state.setUser);

  const [submitting, setSubmitting] = useState(false);

  async function submit({ identifier, password }) {
    clearErrorMessage();
    setSubmitting(true);

    try {
      const loggedInUser = await loginUser({ identifier, password });
      setUser(loggedInUser);
      navigate(getRouteByRole(loggedInUser.role), { replace: true });
    } catch (error) {
      setErrorMessageFromApiError(error);
    } finally {
      setSubmitting(false);
    }
  }

  return {
    submit,
    submitting,
    errorMessage,
    checkingSession: isLoading,
  };
}
