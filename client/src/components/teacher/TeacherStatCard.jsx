export default function TeacherStatCard({ label, value }) {
    return (
        <article className="rounded-3xl bg-white/80 p-6 shadow-md">
            <p className="text-sm font-semibold text-slate-500">{label}</p>
            <p className="mt-3 text-4xl font-bold text-slate-900">{value}</p>
        </article>
    );
}