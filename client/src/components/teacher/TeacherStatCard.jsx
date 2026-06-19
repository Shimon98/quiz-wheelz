export default function TeacherStatCard({ icon, label, value }) {
    return (
        <article className="rounded-3xl bg-white/80 p-5 shadow-[0_8px_24px_rgba(27,42,65,0.08)]">
            <div className="flex items-center gap-3">
                <span
                    aria-hidden="true"
                    className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-50 text-xl"
                >
                    {icon}
                </span>
                <p className="text-sm font-semibold text-slate-500">{label}</p>
            </div>
            <p className="mt-4 text-4xl font-bold text-slate-900">{value}</p>
        </article>
    );
}