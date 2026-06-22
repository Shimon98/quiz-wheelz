export default function DashboardErrorState({ message }) {
    return (
        <div className="flex min-h-[180px] flex-1 items-center justify-center rounded-3xl bg-rose-50 p-6 text-center text-sm font-bold text-rose-700">
            {message}
        </div>
    );
}
