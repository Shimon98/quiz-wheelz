import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../../../api/authApi";
import { useAuthStore } from "../../../stores/authStore";
import useApiErrorNotifier from "../../../hooks/useApiErrorNotifier";
import { getRouteByRole } from "../../../utils/authRouteUtils";

/**
 * useTeacherLogin — all login screen logic, so the content component stays
 * display-only:
 *   - submit({ identifier, password }) → authApi → authStore → role redirect.
 *   - server failures pop as error notifications (field validation stays
 *     inline in the form) — the card never grows to fit an error.
 *
 * The "already signed in?" session check lives in GuestRoute, which wraps
 * the whole PublicEntryShell. The form's value state itself lives in the
 * component (@mantine/form).
 */
export default function useTeacherLogin() {
  const navigate = useNavigate();
  const { notifyApiError } = useApiErrorNotifier();

  const isLoading = useAuthStore((state) => state.isLoading);
  const setUser = useAuthStore((state) => state.setUser);

  const [submitting, setSubmitting] = useState(false);

  async function submit({ identifier, password }) {
    setSubmitting(true);

    try {
      const loggedInUser = await loginUser({ identifier, password });
      setUser(loggedInUser);
      navigate(getRouteByRole(loggedInUser.role), { replace: true });
    } catch (error) {
      notifyApiError(error);
    } finally {
      setSubmitting(false);
    }
  }

  return {
    submit,
    submitting,
    checkingSession: isLoading,
  };
}
