import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../../../api/authApi";
import { useAuthStore } from "../../../stores/authStore";
import { useLanguageStore } from "../../../stores/languageStore";
import useErrorMessage from "../../../hooks/useErrorMessage";
import { getRouteByRole } from "../../../utils/authRouteUtils";

/**
 * useTeacherLogin — all login screen logic, so the content component stays
 * display-only:
 *   - "already signed in?" check on mount → straight to the role's home.
 *   - submit({ identifier, password }) → authApi → authStore → role redirect.
 *   - loading / submitting / server-error state (errorCode → localized text
 *     via the existing errors/errorUtils mapping).
 *
 * The form's value state itself lives in the component (@mantine/form).
 */
export default function useTeacherLogin() {
  const navigate = useNavigate();
  const language = useLanguageStore((state) => state.language);
  const { errorMessage, clearErrorMessage, setErrorMessageFromApiError } =
    useErrorMessage(language);

  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);
  const hasCheckedCurrentUser = useAuthStore(
    (state) => state.hasCheckedCurrentUser,
  );
  const setUser = useAuthStore((state) => state.setUser);
  const loadCurrentUser = useAuthStore((state) => state.loadCurrentUser);

  const [submitting, setSubmitting] = useState(false);

  // Already signed in (or a valid session cookie exists) → skip the form.
  useEffect(() => {
    async function redirectIfAlreadySignedIn() {
      if (isAuthenticated && user) {
        navigate(getRouteByRole(user.role), { replace: true });
        return;
      }

      if (hasCheckedCurrentUser) {
        return;
      }

      const currentUser = await loadCurrentUser();
      if (currentUser) {
        navigate(getRouteByRole(currentUser.role), { replace: true });
      }
    }

    redirectIfAlreadySignedIn();
  }, [isAuthenticated, user, hasCheckedCurrentUser, loadCurrentUser, navigate]);

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
