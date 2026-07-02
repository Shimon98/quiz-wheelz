import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import PublicEntryShell from "../layouts/publicEntry/PublicEntryShell";
import LandingContent from "../features/publicLanding/components/LandingContent";
import TeacherLoginContent from "../features/teacherAuth/components/TeacherLoginContent";
import TeacherRegisterContent from "../features/teacherAuth/components/TeacherRegisterContent";
import ForgotPasswordContent from "../features/teacherAuth/components/ForgotPasswordContent";
import NotFoundPage from "../features/commonPages/NotFoundPage";
import UnauthorizedPage from "../features/commonPages/UnauthorizedPage";
import TeacherWorkspaceShell from "../features/teacherWorkspace/layout/TeacherWorkspaceShell";
import TeacherDashboardHomePage from "../features/teacherWorkspace/pages/TeacherDashboardHomePage";
import TeacherRacesPage from "../features/teacherWorkspace/pages/TeacherRacesPage";
import TeacherRaceRoomPage from "../features/teacherWorkspace/pages/TeacherRaceRoomPage";
import AdminDashboardPage from "../features/admin/pages/AdminDashboardPage";
import { ROUTES } from "../constants/routeConstants";
import { USER_ROLES } from "../constants/roleConstants";
import ProtectedRoute from "./ProtectedRoute";
import RoleRoute from "./RoleRoute";
import GuestRoute from "./GuestRoute";

export default function AppRouter() {
    return (
        <BrowserRouter>
            <Routes>
                <Route
                    element={
                        <GuestRoute>
                            <PublicEntryShell />
                        </GuestRoute>
                    }
                >
                    <Route path={ROUTES.LANDING} element={<LandingContent />} />
                    <Route
                        path={ROUTES.TEACHER_LOGIN}
                        element={<TeacherLoginContent />}
                    />
                    <Route
                        path={ROUTES.TEACHER_REGISTER}
                        element={<TeacherRegisterContent />}
                    />
                    <Route
                        path={ROUTES.TEACHER_FORGOT_PASSWORD}
                        element={<ForgotPasswordContent />}
                    />
                </Route>

                <Route
                    path={ROUTES.LOGIN}
                    element={<Navigate to={ROUTES.TEACHER_LOGIN} replace />}
                />

                {/* The workspace shell is a layout route: guards + chrome
                    render ONCE, only the page content swaps on navigation. */}
                <Route
                    element={
                        <ProtectedRoute>
                            <RoleRoute allowedRoles={[USER_ROLES.TEACHER]}>
                                <TeacherWorkspaceShell />
                            </RoleRoute>
                        </ProtectedRoute>
                    }
                >
                    <Route
                        path={ROUTES.TEACHER_DASHBOARD}
                        element={<TeacherDashboardHomePage />}
                    />
                    <Route
                        path={ROUTES.TEACHER_RACES}
                        element={<TeacherRacesPage />}
                    />
                    <Route
                        path={ROUTES.TEACHER_RACE_ROOM}
                        element={<TeacherRaceRoomPage />}
                    />
                </Route>

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
