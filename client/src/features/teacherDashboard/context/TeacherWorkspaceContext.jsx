import { createContext, useContext } from "react";

export const TeacherWorkspaceContext = createContext(null);

export function useTeacherWorkspace() {
    const context = useContext(TeacherWorkspaceContext);

    if (!context) {
        throw new Error(
            "useTeacherWorkspace must be used inside TeacherDashboardLayout",
        );
    }

    return context;
}