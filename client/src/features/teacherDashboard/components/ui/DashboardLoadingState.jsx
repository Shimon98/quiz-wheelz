export default function DashboardLoadingState({ itemCount = 3 }) {
    return (
        <div className="grid gap-4">
            {Array.from({ length: itemCount }, (_, index) => (
                <div
                    key={index}
                    className="h-36 animate-pulse rounded-3xl bg-white/70 shadow-[0_10px_28px_rgba(27,42,65,0.06)]"
                />
            ))}
        </div>
    );
}
