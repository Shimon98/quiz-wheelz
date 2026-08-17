import httpClient from "./httpClient";
import i18n from "../i18n/i18n";
import { I18N_NAMESPACES } from "../i18n/i18nConstants";
import { useAuthStore } from "../stores/authStore";
import { normalizeApiError } from "../errors/normalizeApiError";
import { isAuthSessionError } from "../errors/errorChecks";
import { showErrorNotification } from "../shared/notifications/appNotifications";

/*
 * Uniform TEACHER-session-expiry handling, registered ONCE from main.jsx (a
 * separate module so httpClient itself stays store-free — authStore ->
 * authApi -> httpClient would otherwise be an import cycle).
 *
 * QuizWheelz has TWO identities: the teacher auth cookie and the RacePlayer
 * race cookie. This interceptor owns ONLY the teacher one:
 *  - /auth/* failures are normal flows handled inline (guest /me probe,
 *    wrong password).
 *  - /race-players/* failures belong to the student feature — a RacePlayer
 *    session error must NEVER clear the teacher store (the same browser can
 *    hold both identities, e.g. a teacher demoing as a student).
 *  - Network/5xx failures never end a session.
 * It clears state and toasts once (fixed id collapses request bursts) — it
 * never navigates; ProtectedRoute reacts to the cleared store on its own.
 */

const SESSION_EXPIRED_NOTIFICATION_ID = "session-expired";

export function registerAuthSessionInterceptor() {
  httpClient.interceptors.response.use(
    (response) => response,
    (error) => {
      const url = error?.config?.url ?? "";
      const isTeacherScopedRequest =
        !url.includes("/auth/") && !url.includes("/race-players/");
      const { isAuthenticated, clearUser } = useAuthStore.getState();

      if (
        isTeacherScopedRequest &&
        isAuthenticated &&
        isAuthSessionError(normalizeApiError(error))
      ) {
        clearUser();
        showErrorNotification({
          id: SESSION_EXPIRED_NOTIFICATION_ID,
          message: i18n.t(`${I18N_NAMESPACES.ERRORS}:auth.sessionExpired`),
        });
      }

      return Promise.reject(error);
    },
  );
}
