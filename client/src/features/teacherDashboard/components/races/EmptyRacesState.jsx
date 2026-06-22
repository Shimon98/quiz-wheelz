import DashboardButton from "../ui/DashboardButton";

export default function EmptyRacesState({
    message,
    createRaceLabel,
    onCreateRaceClick,
}) {
    return (
        <div className="flex min-h-[180px] flex-1 flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
            <p className="max-w-md text-sm font-bold text-slate-500">
                {message}
            </p>

            {onCreateRaceClick && (
                <DashboardButton onClick={onCreateRaceClick} className="mt-5">
                    {createRaceLabel}
                </DashboardButton>
            )}
        </div>
    );
}
