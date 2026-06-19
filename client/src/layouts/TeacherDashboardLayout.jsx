import TeacherSidebar from "../components/teacher/TeacherSidebar";
import { getTeacherDashboardAsset } from "../constants/teacherDashboardAssets";

export default function TeacherDashboardLayout({ children }) {
    const generalBackground = getTeacherDashboardAsset("generalBackground");

    return (
        <div className="relative min-h-screen overflow-hidden bg-sky-100 px-4 py-6 md:px-8">
            {generalBackground && (
                <div
                    aria-hidden="true"
                    className="absolute inset-0 opacity-40"
                    style={{
                        backgroundImage: `url(${generalBackground})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                    }}
                />
            )}

            <div className="relative z-10 mx-auto flex max-w-[1320px] gap-4">
                <TeacherSidebar />

                <main className="flex min-w-0 flex-1 flex-col gap-4">
                    {children}
                </main>
            </div>
        </div>
    );
}
