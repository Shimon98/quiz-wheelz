import DashboardButton from "../ui/DashboardButton";

export default function RoomCodeCard({
    roomCode,
    content,
    onCopyCode,
    onShareLink,
}) {
    return (
        <section className="rounded-3xl bg-white/85 p-6 text-start shadow-[0_10px_28px_rgba(27,42,65,0.08)]">
            <p className="text-sm font-bold text-slate-500">
                {content.roomCodeTitle}
            </p>

            <div className="mt-3 rounded-3xl bg-sky-50 px-6 py-5 text-center">
                <p className="text-5xl font-black tracking-[0.18em] text-sky-700">
                    {roomCode}
                </p>
            </div>

            <p className="mt-4 text-sm font-bold text-slate-500">
                {content.roomCodeDescription}
            </p>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <DashboardButton onClick={onCopyCode} className="flex-1">
                    {content.copyCode}
                </DashboardButton>

                <DashboardButton
                    onClick={onShareLink}
                    variant="secondary"
                    className="flex-1"
                >
                    {content.shareLink}
                </DashboardButton>
            </div>
        </section>
    );
}
