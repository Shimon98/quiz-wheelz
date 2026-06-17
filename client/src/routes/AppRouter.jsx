import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import AppShell from "../layouts/AppShell";
import LoginPage from "../pages/LoginPage";
import NotFoundPage from "../pages/NotFoundPage";
import UnauthorizedPage from "../pages/UnauthorizedPage";
import { ROUTES } from "../constants/routeConstants";
import { USER_ROLES } from "../constants/roleConstants";
import ProtectedRoute from "./ProtectedRoute";
import RoleRoute from "./RoleRoute";

function TeacherDashboardPlaceholder() {
  return (
    <AppShell>
      <section className="flex min-h-screen items-center justify-center bg-sky-100 px-4 text-center">
        <h1 className="text-2xl font-bold text-slate-900">
          Teacher dashboard placeholder
        </h1>
      </section>
    </AppShell>
  );
}

function AdminDashboardPlaceholder() {
  return (
    <AppShell>
      <section className="flex min-h-screen items-center justify-center bg-sky-100 px-4 text-center">
        <h1 className="text-2xl font-bold text-slate-900">
          Admin dashboard placeholder
        </h1>
      </section>
    </AppShell>
  );
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to={ROUTES.LOGIN} replace />} />
        <Route path={ROUTES.LOGIN} element={<LoginPage />} />
        <Route
          path={ROUTES.TEACHER_DASHBOARD}
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={[USER_ROLES.TEACHER]}>
                <TeacherDashboardPlaceholder />
              </RoleRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.ADMIN_DASHBOARD}
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={[USER_ROLES.ADMIN]}>
                <AdminDashboardPlaceholder />
              </RoleRoute>
            </ProtectedRoute>
          }
        />
        <Route path={ROUTES.UNAUTHORIZED} element={<UnauthorizedPage />} />
        <Route path={ROUTES.NOT_FOUND} element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
