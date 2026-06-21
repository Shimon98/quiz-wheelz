import DashboardButton from "../ui/DashboardButton";

export default function RaceMoreMenu({
    race,
    content,
    canEdit,
    canCancel,
    onEditRace,
    onCancelRace,
}) {
    if (!canEdit && !canCancel) {
        return null;
    }

    function closeMenu(event) {
        event.currentTarget.closest("details")?.removeAttribute("open");
    }

    function handleEditRace(event) {
        closeMenu(event);
        onEditRace?.(race);
    }

    function handleCancelRace(event) {
        closeMenu(event);
        onCancelRace?.(race);
    }

    return (
        <details className="group relative">
            <summary
                aria-label={content.raceActions}
                className="flex h-11 w-11 cursor-pointer list-none items-center justify-center rounded-2xl bg-slate-100 text-xl font-extrabold leading-none text-slate-500 transition hover:bg-slate-200 group-open:bg-slate-200 [&::-webkit-details-marker]:hidden"
            >
                ...
            </summary>

            <div className="absolute end-0 z-10 mt-2 min-w-36 overflow-hidden rounded-2xl border border-slate-100 bg-white py-2 text-sm font-bold shadow-xl">
                {canEdit && (
                    <DashboardButton
                        onClick={handleEditRace}
                        variant="ghost"
                        size="sm"
                        className="block w-full rounded-none text-start"
                    >
                        {content.edit}
                    </DashboardButton>
                )}

                {canCancel && (
                    <DashboardButton
                        onClick={handleCancelRace}
                        variant="danger"
                        size="sm"
                        className="block w-full rounded-none text-start"
                    >
                        {content.cancel}
                    </DashboardButton>
                )}
            </div>
        </details>
    );
}
