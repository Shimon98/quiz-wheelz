import TeacherSidebar from "../components/teacher/TeacherSidebar";

export default function TeacherDashboardLayout({ children }) {
    return (
        <div className="min-h-screen bg-sky-100 px-4 py-6 md:px-8">
            <div className="mx-auto flex max-w-[1320px] gap-6">
                <TeacherSidebar />

                <main className="flex min-w-0 flex-1 flex-col gap-6">
                    {children}
                </main>
            </div>
        </div>
    );
}
