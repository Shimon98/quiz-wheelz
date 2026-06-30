import { BrowserRouter, Route, Routes } from "react-router-dom";
import PublicLandingPage from "../features/publicLanding/pages/PublicLandingPage";
import LoginPage from "../features/auth/pages/LoginPage";
import NotFoundPage from "../features/commonPages/NotFoundPage";
import UnauthorizedPage from "../features/commonPages/UnauthorizedPage";
import TeacherDashboardPage from "../features/teacherDashboard/pages/TeacherDashboardPage";
import TeacherRaceRoomPage from "../features/teacherDashboard/pages/TeacherRaceRoomPage";
import AdminDashboardPage from "../features/admin/pages/AdminDashboardPage";
import { ROUTES } from "../constants/routeConstants";
import { USER_ROLES } from "../constants/roleConstants";
import ProtectedRoute from "./ProtectedRoute";
import RoleRoute from "./RoleRoute";

export default function AppRouter() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path={ROUTES.LANDING} element={<PublicLandingPage />} />

                <Route path={ROUTES.LOGIN} element={<LoginPage />} />

                <Route
                    path={ROUTES.TEACHER_DASHBOARD}
                    element={
                        <ProtectedRoute>
                            <RoleRoute allowedRoles={[USER_ROLES.TEACHER]}>
                                <TeacherDashboardPage />
                            </RoleRoute>
                        </ProtectedRoute>
                    }
                />

                <Route
                    path={ROUTES.TEACHER_RACE_ROOM}
                    element={
                        <ProtectedRoute>
                            <RoleRoute allowedRoles={[USER_ROLES.TEACHER]}>
                                <TeacherRaceRoomPage />
                            </RoleRoute>
                        </ProtectedRoute>
                    }
                />

                <Route
                    path={ROUTES.ADMIN_DASHBOARD}
                    element={
                        <ProtectedRoute>
                            <RoleRoute allowedRoles={[USER_ROLES.ADMIN]}>
                                <AdminDashboardPage />
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
