import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import PublicEntryShell from "../layouts/publicEntry/PublicEntryShell";
import LandingContent from "../features/publicLanding/components/LandingContent";
import TeacherLoginContent from "../features/teacherAuth/components/TeacherLoginContent";
import TeacherRegisterContent from "../features/teacherAuth/components/TeacherRegisterContent";
import ForgotPasswordContent from "../features/teacherAuth/components/ForgotPasswordContent";
import NotFoundPage from "../features/commonPages/NotFoundPage";
import UnauthorizedPage from "../features/commonPages/UnauthorizedPage";
import TeacherWorkspaceShell from "../features/teacherWorkspace/layout/TeacherWorkspaceShell";
import StudentShell from "../features/studentJoin/layout/StudentShell";
import StudentJoinPage from "../features/studentJoin/pages/StudentJoinPage";
import StudentWaitingPage from "../features/studentJoin/pages/StudentWaitingPage";
import TeacherDashboardHomePage from "../features/teacherWorkspace/pages/TeacherDashboardHomePage";
import TeacherRacesPage from "../features/teacherWorkspace/pages/TeacherRacesPage";
import TeacherRaceRoomPage from "../features/teacherWorkspace/pages/TeacherRaceRoomPage";
import AdminDashboardPage from "../features/admin/pages/AdminDashboardPage";
import { ROUTES } from "../constants/routeConstants";
import { USER_ROLES } from "../constants/roleConstants";
import ProtectedRoute from "./ProtectedRoute";
import RoleRoute from "./RoleRoute";
import GuestRoute from "./GuestRoute";

const StudentRaceVisualPreview = import.meta.env.DEV
    ? lazy(() => import("../features/studentRace/dev/StudentRaceVisualPreview"))
    : null;

const StudentRacePage = lazy(
    () => import("../features/studentRace/pages/StudentRacePage")
);

const TeacherRaceLivePage = lazy(
    () => import("../features/teacherLiveRace/pages/TeacherRaceLivePage")
);

export default function AppRouter() {
    return (
        <BrowserRouter>
            <Routes>
                {import.meta.env.DEV && (
                    <Route
                        path="/dev/race"
                        element={
                            <Suspense fallback={null}>
                                <StudentRaceVisualPreview />
                            </Suspense>
                        }
                    />
                )}

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
                    <Route
                        path={ROUTES.TEACHER_RACE_LIVE}
                        element={
                            <Suspense fallback={null}>
                                <TeacherRaceLivePage />
                            </Suspense>
                        }
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

                <Route element={<StudentShell />}>
                    <Route
                        path={ROUTES.STUDENT_JOIN}
                        element={<StudentJoinPage />}
                    />
                    <Route
                        path={ROUTES.STUDENT_JOIN_WITH_CODE}
                        element={<StudentJoinPage />}
                    />
                    <Route
                        path={ROUTES.STUDENT_WAITING}
                        element={<StudentWaitingPage />}
                    />
                </Route>

                <Route
                    path={ROUTES.STUDENT_RACE}
                    element={
                        <Suspense fallback={null}>
                            <StudentRacePage />
                        </Suspense>
                    }
                />

                <Route path={ROUTES.UNAUTHORIZED} element={<UnauthorizedPage />} />
                <Route path={ROUTES.NOT_FOUND} element={<NotFoundPage />} />
            </Routes>
        </BrowserRouter>
    );
}
