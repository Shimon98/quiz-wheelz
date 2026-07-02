import httpClient from "./httpClient";
import i18n from "../i18n/i18n";
import { I18N_NAMESPACES } from "../i18n/i18nConstants";
import { useAuthStore } from "../stores/authStore";
import { showErrorNotification } from "../shared/notifications/appNotifications";

/*
 * Uniform 401 handling, registered ONCE from main.jsx (a separate module so
 * httpClient itself stays store-free — authStore -> authApi -> httpClient
 * would otherwise be an import cycle).
 *
 * Any 401 outside the /auth endpoints means the session died mid-work:
 * clear the auth state (ProtectedRoute then redirects to the landing page on
 * its own) and tell the user once — the fixed notification id collapses the
 * burst when several requests fail together.
 */

const SESSION_EXPIRED_NOTIFICATION_ID = "session-expired";

export function registerAuthSessionInterceptor() {
  httpClient.interceptors.response.use(
    (response) => response,
    (error) => {
      const status = error?.response?.status;
      const url = error?.config?.url ?? "";
      const { isAuthenticated, clearUser } = useAuthStore.getState();

      // /auth/* 401s are normal flows (guest /me probe, wrong password) and
      // are handled inline where they happen.
      if (status === 401 && !url.includes("/auth/") && isAuthenticated) {
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
